import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Badge, BadgeDocument } from './schemas/badge.schema';
import { UserBadge, UserBadgeDocument } from './schemas/user-badge.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Offer, OfferDocument } from '../offers/schemas/offer.schema';
import { OfferStatus } from '../../common/enums/offer-status.enum';
import { BadgesService } from './badges.service';
import { BadgeEngineSettingsService } from './badge-engine-settings.service';

const FREQUENCY_MS: Record<string, number> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

@Injectable()
export class BadgeEngineService {
  private readonly logger = new Logger(BadgeEngineService.name);

  constructor(
    @InjectModel(Badge.name) private readonly badgeModel: Model<BadgeDocument>,
    @InjectModel(UserBadge.name) private readonly userBadgeModel: Model<UserBadgeDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Offer.name) private readonly offerModel: Model<OfferDocument>,
    private readonly badgesService: BadgesService,
    private readonly settingsService: BadgeEngineSettingsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledRecalculate(): Promise<void> {
    const settings = await this.settingsService.getPolicy();
    if (!settings.autoBadgesEnabled || settings.recalculationFrequency === 'manual') return;

    const intervalMs = FREQUENCY_MS[settings.recalculationFrequency] ?? FREQUENCY_MS.daily;
    const dueAt = settings.lastRunAt ? settings.lastRunAt.getTime() + intervalMs : 0;
    if (Date.now() < dueAt) return;

    await this.recalculate();
  }

  /** Scans every auto-assignable badge against current user stats and awards to newly-qualifying users. */
  async recalculate(): Promise<{ scanned: number; awarded: number }> {
    const settings = await this.settingsService.getPolicy();
    if (!settings.autoBadgesEnabled) {
      return { scanned: 0, awarded: 0 };
    }

    const badges = await this.badgeModel.find({ autoAssign: true, criteriaType: { $ne: 'manual' } }).lean();
    let scanned = 0;
    let awarded = 0;

    for (const badge of badges) {
      const qualifyingUserIds = await this.findQualifyingUsers(badge.criteriaType, badge.criteriaValue);
      scanned += qualifyingUserIds.length;
      if (!qualifyingUserIds.length) continue;

      const existing = await this.userBadgeModel
        .find({ badge: badge._id, user: { $in: qualifyingUserIds } })
        .select('user')
        .lean();
      const alreadyAwarded = new Set(existing.map(e => e.user.toString()));

      for (const userId of qualifyingUserIds) {
        if (alreadyAwarded.has(userId.toString())) continue;
        const result = await this.badgesService.assign(badge._id.toString(), userId.toString(), 'auto-engine');
        if (result) awarded += 1;
      }
    }

    await this.settingsService.recordRun({ scanned, awarded });
    this.logger.log(`Badge recalculation: ${scanned} candidates scanned, ${awarded} badges awarded`);
    return { scanned, awarded };
  }

  /** Checks whether a specific user currently qualifies for a badge's criteria (used to gate manual overrides). */
  async userQualifies(badge: BadgeDocument, userId: string): Promise<boolean> {
    if (badge.criteriaType === 'manual') return true;
    const qualifying = await this.findQualifyingUsers(badge.criteriaType, badge.criteriaValue, userId);
    return qualifying.some(id => id.toString() === userId);
  }

  private async findQualifyingUsers(
    criteriaType: string,
    criteriaValue: number,
    onlyUserId?: string,
  ): Promise<Types.ObjectId[]> {
    const scopeFilter = onlyUserId ? { _id: new Types.ObjectId(onlyUserId) } : {};

    if (criteriaType === 'kg_collected') {
      const users = await this.userModel
        .find({ ...scopeFilter, totalKgCollected: { $gte: criteriaValue }, isDeleted: { $ne: true } })
        .select('_id')
        .lean();
      return users.map(u => u._id);
    }

    if (criteriaType === 'offers_completed') {
      const match: Record<string, unknown> = { status: OfferStatus.CLOSED };
      if (onlyUserId) match.owner = new Types.ObjectId(onlyUserId);
      const counts = await this.offerModel.aggregate([
        { $match: match },
        { $group: { _id: '$owner', count: { $sum: 1 } } },
        { $match: { count: { $gte: criteriaValue } } },
      ]);
      return counts.map(c => c._id as Types.ObjectId);
    }

    if (criteriaType === 'days_active') {
      // No per-day activity log exists — account age (days since registration) is used as the best-effort proxy.
      const cutoff = new Date(Date.now() - criteriaValue * 24 * 60 * 60 * 1000);
      const users = await this.userModel
        .find({ ...scopeFilter, createdAt: { $lte: cutoff }, isDeleted: { $ne: true } } as any)
        .select('_id')
        .lean();
      return users.map(u => u._id);
    }

    return [];
  }
}
