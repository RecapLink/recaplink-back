import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Badge, BadgeDocument } from './schemas/badge.schema';
import { UserBadge, UserBadgeDocument } from './schemas/user-badge.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BadgesService {
  constructor(
    @InjectModel(Badge.name) private readonly badgeModel: Model<BadgeDocument>,
    @InjectModel(UserBadge.name) private readonly userBadgeModel: Model<UserBadgeDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll() {
    return this.badgeModel.find().lean();
  }

  async create(dto: any, adminId: string): Promise<BadgeDocument> {
    const badge = await this.badgeModel.create(dto);

    await this.notificationsService.notifyAdmins({
      type: 'badge_created',
      title: 'Nouveau badge',
      message: `Le badge "${badge.name?.fr || ''}" a été créé`,
      link: '/admin/badges',
      createdBy: adminId,
      metadata: { badgeId: badge._id.toString() },
    });

    return badge;
  }

  async update(id: string, dto: any, adminId: string): Promise<BadgeDocument> {
    const badge = await this.badgeModel.findByIdAndUpdate(new Types.ObjectId(id), dto, { new: true });
    if (!badge) throw new NotFoundException('Badge not found');

    await this.notificationsService.notifyAdmins({
      type: 'badge_updated',
      title: 'Badge modifié',
      message: `Le badge "${badge.name?.fr || ''}" a été mis à jour`,
      link: '/admin/badges',
      createdBy: adminId,
      metadata: { badgeId: id },
    });

    return badge;
  }

  async remove(id: string, adminId: string): Promise<void> {
    const badge = await this.badgeModel.findById(new Types.ObjectId(id));
    await this.badgeModel.deleteOne({ _id: new Types.ObjectId(id) });

    await this.notificationsService.notifyAdmins({
      type: 'badge_deleted',
      title: 'Badge supprimé',
      message: `Le badge "${badge?.name?.fr || ''}" a été supprimé`,
      createdBy: adminId,
      metadata: { badgeId: id },
    });
  }

  async assign(badgeId: string, userId: string): Promise<UserBadgeDocument> {
    const badge = await this.badgeModel.findById(new Types.ObjectId(badgeId));
    if (!badge) throw new NotFoundException('Badge not found');
    const ub = await this.userBadgeModel.create({
      badge: new Types.ObjectId(badgeId),
      user: new Types.ObjectId(userId),
    });
    await this.badgeModel.findByIdAndUpdate(badgeId, { $inc: { userCount: 1 } });

    await this.notificationsService.create({
      recipientId: userId,
      type: 'badge_awarded',
      title: 'Nouveau badge !',
      message: `Vous avez reçu le badge "${badge.name?.fr || ''}"`,
      link: '/profile/badges',
      metadata: { badgeId },
    });

    await this.notificationsService.notifyAdmins({
      type: 'badge_awarded',
      title: 'Badge attribué',
      message: `Le badge "${badge.name?.fr || ''}" a été attribué à un utilisateur`,
      link: '/admin/badges',
      metadata: { badgeId, userId },
    });

    return ub;
  }

  async getUserBadges(userId: string) {
    return this.userBadgeModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('badge')
      .lean();
  }
}
