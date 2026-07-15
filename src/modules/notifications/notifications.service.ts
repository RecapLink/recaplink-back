import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationsRepository } from './notifications.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NOTIFICATION_META, DEFAULT_NOTIFICATION_META } from './notification-types';
import { MessagingGateway } from '../conversations/messaging.gateway';
import { NotificationSettingsService } from './notification-settings.service';
import { EmailService } from '../email/email.service';
import { Role } from '../../common/enums/role.enum';

interface NotifyAdminsParams {
  type: string;
  title: string;
  message: string;
  link?: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
  prefKey?: 'newSignalement' | 'newInscription' | 'chatbotEscalade';
}

interface NotifyRolesParams {
  roles: string[];
  type: string;
  title: string;
  message: string;
  link?: string;
  excludeUserId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repo: NotificationsRepository,
    private readonly messagingGateway: MessagingGateway,
    private readonly settingsService: NotificationSettingsService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateNotificationDto & { createdBy?: string }) {
    if (dto.createdBy && dto.createdBy === dto.recipientId) return;

    const meta = NOTIFICATION_META[dto.type] || DEFAULT_NOTIFICATION_META;
    const settings = await this.settingsService.getPolicy();
    if (!this.settingsService.isCategoryEnabled(settings, meta.category)) return;

    const { title, message } = this.resolveContent(settings, dto.type, dto.title, dto.message);

    const notif = await this.repo.insertOne({
      recipient: new Types.ObjectId(dto.recipientId),
      type: dto.type,
      category: meta.category,
      icon: meta.icon,
      color: meta.color,
      title,
      message,
      link: dto.link || '',
      createdBy: dto.createdBy ? new Types.ObjectId(dto.createdBy) : undefined,
      metadata: dto.metadata,
    });

    if (settings.realtimeEnabled) {
      this.messagingGateway.emitToUser(dto.recipientId, 'new_notification', notif);
    }

    return notif;
  }

  /** Fan out a notification to every admin/super-admin, optionally gated by a notifPrefs toggle. Excludes the actor. */
  async notifyAdmins(params: NotifyAdminsParams): Promise<void> {
    const meta = NOTIFICATION_META[params.type] || DEFAULT_NOTIFICATION_META;
    const settings = await this.settingsService.getPolicy();
    if (!settings.channels.dashboard) return; // dashboard channel gates admin-directed notifications
    if (!this.settingsService.isCategoryEnabled(settings, meta.category)) return;

    const adminIds = await this.repo.findAdminIds(params.prefKey, params.createdBy);
    if (!adminIds.length) return;

    const { title, message } = this.resolveContent(settings, params.type, params.title, params.message);

    const docs = adminIds.map(recipient => ({
      recipient,
      type: params.type,
      category: meta.category,
      icon: meta.icon,
      color: meta.color,
      title,
      message,
      link: params.link || '',
      createdBy: params.createdBy ? new Types.ObjectId(params.createdBy) : undefined,
      metadata: params.metadata,
    }));

    await this.repo.insertMany(docs);

    if (settings.realtimeEnabled) {
      this.messagingGateway.emitToRoom(
        'super-admins',
        'new_notification',
        { type: params.type, category: meta.category, icon: meta.icon, color: meta.color, title, message, link: params.link || '', metadata: params.metadata },
        params.createdBy,
      );
    }

    if (settings.channels.email) {
      const contacts = await this.repo.findAdminEmails(params.prefKey, params.createdBy);
      await Promise.all(
        contacts.map(c =>
          this.emailService.sendNotificationEmail({ to: c.email, fullName: c.fullName, title, message, link: params.link }),
        ),
      );
    }
  }

  /** Fan out a notification to every user with one of the given roles. Excludes the actor. */
  async notifyRoles(params: NotifyRolesParams): Promise<void> {
    const meta = NOTIFICATION_META[params.type] || DEFAULT_NOTIFICATION_META;
    const settings = await this.settingsService.getPolicy();
    if (!this.settingsService.isCategoryEnabled(settings, meta.category)) return;

    // "mobile" channel gates plain-user recipients, "dashboard" gates admin/super-admin recipients
    const allowedRoles = params.roles.filter(role => {
      if (role === Role.USER) return settings.channels.mobile;
      return settings.channels.dashboard;
    });
    if (!allowedRoles.length) return;

    const recipientIds = await this.repo.findByRoles(allowedRoles, params.excludeUserId);
    if (!recipientIds.length) return;

    const { title, message } = this.resolveContent(settings, params.type, params.title, params.message);

    const docs = recipientIds.map(recipient => ({
      recipient,
      type: params.type,
      category: meta.category,
      icon: meta.icon,
      color: meta.color,
      title,
      message,
      link: params.link || '',
      createdBy: params.excludeUserId ? new Types.ObjectId(params.excludeUserId) : undefined,
      metadata: params.metadata,
    }));

    await this.repo.insertMany(docs);

    if (settings.realtimeEnabled) {
      this.messagingGateway.emitToRoles(
        allowedRoles,
        'new_notification',
        { type: params.type, category: meta.category, icon: meta.icon, color: meta.color, title, message, link: params.link || '', metadata: params.metadata },
        params.excludeUserId,
      );
    }
  }

  /** Recent actions this admin performed (not notifications they received) — profile activity timeline. */
  async findRecentByCreator(userId: string, limit = 20) {
    return this.repo.findRecentByCreator(new Types.ObjectId(userId), limit);
  }

  /** Count of distinct users this admin has directly acted on — "users managed" KPI. */
  async countDistinctManagedUsers(userId: string): Promise<number> {
    return this.repo.countDistinctManagedUsers(new Types.ObjectId(userId));
  }

  async findForUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.repo.findForRecipient(new Types.ObjectId(userId), (page - 1) * limit, limit);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async countUnread(userId: string): Promise<number> {
    return this.repo.countUnread(new Types.ObjectId(userId));
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.repo.markRead(new Types.ObjectId(id), new Types.ObjectId(userId));
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.markAllRead(new Types.ObjectId(userId));
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.repo.deleteOne(new Types.ObjectId(id), new Types.ObjectId(userId));
  }

  /** Applies an admin-configured template override for this event type, when one exists. */
  private resolveContent(
    settings: Awaited<ReturnType<NotificationSettingsService['getPolicy']>>,
    type: string,
    fallbackTitle: string,
    fallbackMessage: string,
  ): { title: string; message: string } {
    const template = this.settingsService.findTemplate(settings, type);
    return template
      ? { title: template.title, message: template.message }
      : { title: fallbackTitle, message: fallbackMessage };
  }
}
