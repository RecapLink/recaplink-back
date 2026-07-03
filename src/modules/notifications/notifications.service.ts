import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationsRepository } from './notifications.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NOTIFICATION_META, DEFAULT_NOTIFICATION_META } from './notification-types';
import { MessagingGateway } from '../conversations/messaging.gateway';

interface NotifyAdminsParams {
  type: string;
  title: string;
  message: string;
  link?: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
  prefKey?: 'newSignalement' | 'newInscription' | 'chatbotEscalade';
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repo: NotificationsRepository,
    private readonly messagingGateway: MessagingGateway,
  ) {}

  async create(dto: CreateNotificationDto & { createdBy?: string }) {
    const meta = NOTIFICATION_META[dto.type] || DEFAULT_NOTIFICATION_META;
    const notif = await this.repo.insertOne({
      recipient: new Types.ObjectId(dto.recipientId),
      type: dto.type,
      category: meta.category,
      icon: meta.icon,
      color: meta.color,
      title: dto.title,
      message: dto.message,
      link: dto.link || '',
      createdBy: dto.createdBy ? new Types.ObjectId(dto.createdBy) : undefined,
      metadata: dto.metadata,
    });

    this.messagingGateway.emitToUser(dto.recipientId, 'new_notification', notif);

    return notif;
  }

  /** Fan out a notification to every admin/super-admin, optionally gated by a notifPrefs toggle. */
  async notifyAdmins(params: NotifyAdminsParams): Promise<void> {
    const adminIds = await this.repo.findAdminIds(params.prefKey);
    if (!adminIds.length) return;

    const meta = NOTIFICATION_META[params.type] || DEFAULT_NOTIFICATION_META;
    const docs = adminIds.map(recipient => ({
      recipient,
      type: params.type,
      category: meta.category,
      icon: meta.icon,
      color: meta.color,
      title: params.title,
      message: params.message,
      link: params.link || '',
      createdBy: params.createdBy ? new Types.ObjectId(params.createdBy) : undefined,
      metadata: params.metadata,
    }));

    await this.repo.insertMany(docs);

    for (const doc of docs) {
      this.messagingGateway.emitToUser(doc.recipient.toString(), 'new_notification', doc);
    }
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
}
