import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../../common/enums/role.enum';

export interface NotificationCreateData {
  recipient: Types.ObjectId;
  type: string;
  category: string;
  title: string;
  message: string;
  icon?: string;
  color?: string;
  link?: string;
  createdBy?: Types.ObjectId;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectModel(Notification.name) private readonly model: Model<NotificationDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async insertOne(data: NotificationCreateData): Promise<NotificationDocument> {
    return this.model.create(data);
  }

  async insertMany(data: NotificationCreateData[]): Promise<void> {
    if (!data.length) return;
    await this.model.insertMany(data);
  }

  async findAdminIds(prefKey?: string, excludeUserId?: string): Promise<Types.ObjectId[]> {
    const filter: Record<string, unknown> = { role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] } };
    if (prefKey) filter[`notifPrefs.${prefKey}`] = { $ne: false };
    if (excludeUserId) filter._id = { $ne: new Types.ObjectId(excludeUserId) };
    const admins = await this.userModel.find(filter).select('_id').lean();
    return admins.map(a => a._id);
  }

  async findByRoles(roles: string[], excludeUserId?: string): Promise<Types.ObjectId[]> {
    const filter: Record<string, unknown> = { role: { $in: roles } };
    if (excludeUserId) filter._id = { $ne: new Types.ObjectId(excludeUserId) };
    const users = await this.userModel.find(filter).select('_id').lean();
    return users.map(u => u._id);
  }

  async findForRecipient(recipientId: Types.ObjectId, skip: number, limit: number) {
    return Promise.all([
      this.model
        .find({ recipient: recipientId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments({ recipient: recipientId }),
    ]);
  }

  async countUnread(recipientId: Types.ObjectId): Promise<number> {
    return this.model.countDocuments({ recipient: recipientId, isRead: false });
  }

  async markRead(id: Types.ObjectId, recipientId: Types.ObjectId): Promise<void> {
    await this.model.updateOne({ _id: id, recipient: recipientId }, { isRead: true });
  }

  async markAllRead(recipientId: Types.ObjectId): Promise<void> {
    await this.model.updateMany({ recipient: recipientId, isRead: false }, { isRead: true });
  }

  async deleteOne(id: Types.ObjectId, recipientId: Types.ObjectId): Promise<void> {
    await this.model.deleteOne({ _id: id, recipient: recipientId });
  }
}
