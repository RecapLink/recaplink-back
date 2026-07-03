import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../../common/enums/role.enum';

interface NotifyAdminsParams {
  type: string;
  title: string;
  body: string;
  link?: string;
  prefKey?: 'newSignalement' | 'newInscription' | 'chatbotEscalade';
  excludeUserId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly model: Model<NotificationDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    return this.model.create({ ...dto, recipient: new Types.ObjectId(dto.recipientId) });
  }

  /** Fan out a notification to every admin/super-admin, optionally gated by a notifPrefs toggle. */
  async notifyAdmins(params: NotifyAdminsParams): Promise<void> {
    const filter: FilterQuery<UserDocument> = { role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] } };
    if (params.prefKey) filter[`notifPrefs.${params.prefKey}`] = { $ne: false };
    if (params.excludeUserId) filter._id = { $ne: new Types.ObjectId(params.excludeUserId) };

    const admins = await this.userModel.find(filter).select('_id').lean();
    if (!admins.length) return;

    await this.model.insertMany(
      admins.map(a => ({
        recipient: a._id,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link || '',
      })),
    );
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
