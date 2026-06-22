import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Offer } from '../offers/schemas/offer.schema';
import { UserBadge } from '../badges/schemas/user-badge.schema';
import { Badge } from '../badges/schemas/badge.schema';
import { Knowledge } from '../knowledge/schemas/knowledge.schema';
import { Report } from '../reports/schemas/report.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<any>,
    @InjectModel(Offer.name) private readonly offerModel: Model<any>,
    @InjectModel(UserBadge.name) private readonly userBadgeModel: Model<any>,
    @InjectModel(Badge.name) private readonly badgeModel: Model<any>,
    @InjectModel(Knowledge.name) private readonly knowledgeModel: Model<any>,
    @InjectModel(Report.name) private readonly reportModel: Model<any>,
  ) {}

  async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      activeOffers,
      offersThisMonth,
      offersLastMonth,
      activeCollectors,
      newCollectors,
      activeRecyclers,
      newRecyclers,
      plasticTypes,
      kgThisMonthAgg,
      kgLastMonthAgg,
    ] = await Promise.all([
      this.offerModel.countDocuments({ status: 'active' }),
      this.offerModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      this.offerModel.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      this.userModel.countDocuments({ role: 'collecteur', status: 'active' }),
      this.userModel.countDocuments({ role: 'collecteur', status: 'active', createdAt: { $gte: startOfMonth } }),
      this.userModel.countDocuments({ role: 'recycleur', status: 'active' }),
      this.userModel.countDocuments({ role: 'recycleur', status: 'active', createdAt: { $gte: startOfMonth } }),
      this.offerModel.aggregate([
        { $match: { status: { $in: ['active', 'verified', 'closed'] } } },
        { $group: { _id: '$plasticType', count: { $sum: 1 }, totalKg: { $sum: '$quantityKg' } } },
        { $sort: { count: -1 } },
      ]),
      this.offerModel.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'pending' } } },
        { $group: { _id: null, total: { $sum: '$quantityKg' } } },
      ]),
      this.offerModel.aggregate([
        { $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }, status: { $ne: 'pending' } } },
        { $group: { _id: null, total: { $sum: '$quantityKg' } } },
      ]),
    ]);

    const kgThisMonth = kgThisMonthAgg[0]?.total ?? 0;
    const kgLastMonth = kgLastMonthAgg[0]?.total ?? 0;

    const totalActiveOffers = plasticTypes.reduce((s: number, p: any) => s + p.count, 0) || 1;
    const plasticTypeDistribution = plasticTypes.map((p: any) => ({
      type: p._id,
      count: p.count,
      totalKg: p.totalKg ?? 0,
      percentage: Math.round((p.count / totalActiveOffers) * 100),
    }));

    const kgTrend = kgLastMonth > 0
      ? Math.round(((kgThisMonth - kgLastMonth) / kgLastMonth) * 100)
      : kgThisMonth > 0 ? 100 : 0;

    const offersTrend = offersLastMonth > 0
      ? Math.round(((offersThisMonth - offersLastMonth) / offersLastMonth) * 100)
      : offersThisMonth > 0 ? 100 : 0;

    return {
      kgRecycledThisMonth: kgThisMonth,
      kgTrend,
      activeOffers,
      offersThisMonth,
      offersTrend,
      activeCollectors,
      newCollectorsThisMonth: newCollectors,
      activeRecyclers,
      newRecyclersThisMonth: newRecyclers,
      plasticTypeDistribution,
    };
  }

  async getPlasticDistribution() {
    const plasticTypes = await this.offerModel.aggregate([
      { $match: { status: { $in: ['active', 'verified', 'closed'] } } },
      { $group: { _id: '$plasticType', count: { $sum: 1 }, totalKg: { $sum: '$quantityKg' } } },
      { $sort: { count: -1 } },
    ]);

    const total = plasticTypes.reduce((s: number, p: any) => s + p.count, 0) || 1;
    return plasticTypes.map((p: any) => ({
      type: p._id,
      count: p.count,
      totalKg: p.totalKg ?? 0,
      percentage: Math.round((p.count / total) * 100),
    }));
  }

  async getActivityFeed(limit = 20) {
    const [recentUsers, recentOffers, recentBadgeAwards, recentKnowledge, recentReports] =
      await Promise.all([
        this.userModel
          .find({ role: { $in: ['collecteur', 'recycleur'] } })
          .sort({ createdAt: -1 })
          .limit(6)
          .select('fullName role zone city createdAt')
          .lean(),
        this.offerModel
          .find()
          .sort({ createdAt: -1 })
          .limit(6)
          .select('title plasticType location createdAt')
          .lean(),
        this.userBadgeModel
          .find()
          .sort({ createdAt: -1 })
          .limit(6)
          .populate('user', 'fullName')
          .populate('badge', 'name')
          .lean(),
        this.knowledgeModel
          .find({ status: 'published' })
          .sort({ createdAt: -1 })
          .limit(4)
          .select('title type createdAt')
          .lean(),
        this.reportModel
          .find({ status: 'pending' })
          .sort({ createdAt: -1 })
          .limit(4)
          .select('type reason createdAt')
          .lean(),
      ]);

    const events: Array<{ type: string; title: string; sub: string; createdAt: Date }> = [
      ...recentUsers.map((u: any) => ({
        type: u.role === 'collecteur' ? 'user_registration_collector' : 'user_registration_recycler',
        title: `Nouveau ${u.role} inscrit — ${u.fullName}`,
        sub: [u.city, u.zone].filter(Boolean).join(' · ') || 'Zone non définie',
        createdAt: u.createdAt,
      })),
      ...recentOffers.map((o: any) => ({
        type: 'new_offer',
        title: `Nouvelle offre — ${o.title}`,
        sub: [o.plasticType, o.location?.city].filter(Boolean).join(' · '),
        createdAt: o.createdAt,
      })),
      ...recentBadgeAwards.map((b: any) => ({
        type: 'badge_award',
        title: `Badge "${b.badge?.name?.fr || 'Badge'}" attribué`,
        sub: b.user?.fullName || 'Utilisateur',
        createdAt: b.createdAt,
      })),
      ...recentKnowledge.map((k: any) => ({
        type: 'knowledge_published',
        title: `Nouvelle fiche savoir-faire publiée`,
        sub: k.title?.fr || 'Sans titre',
        createdAt: k.createdAt,
      })),
      ...recentReports.map((r: any) => ({
        type: 'report',
        title: `Signalement ${r.type} — En attente de modération`,
        sub: r.reason || '',
        createdAt: r.createdAt,
      })),
    ];

    return events
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getRegistrationsByMonth() {
    const months: Array<{ start: Date; end: Date; label: string }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      months.push({
        start: d,
        end,
        label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      });
    }
    return Promise.all(
      months.map(async (m) => ({
        month: m.label,
        count: await this.userModel.countDocuments({
          createdAt: { $gte: m.start, $lt: m.end },
        }),
      })),
    );
  }

  async getCollectionsByZone() {
    const results = await this.offerModel.aggregate([
      { $match: { status: { $in: ['active', 'verified', 'closed'] }, 'location.zone': { $exists: true, $ne: '' } } },
      { $group: { _id: '$location.zone', totalKg: { $sum: '$quantityKg' }, count: { $sum: 1 } } },
      { $sort: { totalKg: -1 } },
      { $limit: 10 },
      { $project: { zone: '$_id', totalKg: 1, count: 1, _id: 0 } },
    ]);

    // Fallback to user-based if no offer data
    if (results.length === 0) {
      return this.userModel.aggregate([
        { $match: { role: 'collecteur', zone: { $exists: true, $ne: '' } } },
        { $group: { _id: '$zone', totalKg: { $sum: '$totalKgCollected' } } },
        { $sort: { totalKg: -1 } },
        { $limit: 10 },
        { $project: { zone: '$_id', totalKg: 1, _id: 0 } },
      ]);
    }
    return results;
  }
}
