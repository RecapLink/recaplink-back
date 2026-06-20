import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Badge, BadgeDocument } from './schemas/badge.schema';
import { UserBadge, UserBadgeDocument } from './schemas/user-badge.schema';

@Injectable()
export class BadgesService {
  constructor(
    @InjectModel(Badge.name) private readonly badgeModel: Model<BadgeDocument>,
    @InjectModel(UserBadge.name) private readonly userBadgeModel: Model<UserBadgeDocument>,
  ) {}

  findAll() {
    return this.badgeModel.find().lean();
  }

  async create(dto: any): Promise<BadgeDocument> {
    return this.badgeModel.create(dto);
  }

  async update(id: string, dto: any): Promise<BadgeDocument> {
    return this.badgeModel.findByIdAndUpdate(new Types.ObjectId(id), dto, { new: true });
  }

  async remove(id: string): Promise<void> {
    await this.badgeModel.deleteOne({ _id: new Types.ObjectId(id) });
  }

  async assign(badgeId: string, userId: string): Promise<UserBadgeDocument> {
    const badge = await this.badgeModel.findById(new Types.ObjectId(badgeId));
    if (!badge) throw new NotFoundException('Badge not found');
    const ub = await this.userBadgeModel.create({
      badge: new Types.ObjectId(badgeId),
      user: new Types.ObjectId(userId),
    });
    await this.badgeModel.findByIdAndUpdate(badgeId, { $inc: { userCount: 1 } });
    return ub;
  }

  async getUserBadges(userId: string) {
    return this.userBadgeModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('badge')
      .lean();
  }
}
