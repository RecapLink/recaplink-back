import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private readonly model: Model<NotificationDocument>) {}

  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    return this.model.create({ ...dto, recipient: new Types.ObjectId(dto.recipientId) });
  }

  async findForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model
        .find({ recipient: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments({ recipient: new Types.ObjectId(userId) }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async countUnread(userId: string): Promise<number> {
    return this.model.countDocuments({ recipient: new Types.ObjectId(userId), isRead: false });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: new Types.ObjectId(id), recipient: new Types.ObjectId(userId) },
      { isRead: true },
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await this.model.updateMany(
      { recipient: new Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.model.deleteOne({
      _id: new Types.ObjectId(id),
      recipient: new Types.ObjectId(userId),
    });
  }
}
