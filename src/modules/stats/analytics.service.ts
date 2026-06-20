import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Offer } from '../offers/schemas/offer.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<any>,
    @InjectModel(Offer.name) private readonly offerModel: Model<any>,
  ) {}

  async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeOffers,
      activeOffersLastMonth,
      activeCollectors,
      newCollectors,
      activeRecyclers,
      newRecyclers,
      plasticTypes,
    ] = await Promise.all([
      this.offerModel.countDocuments({ status: 'active' }),
      this.offerModel.countDocuments({ status: 'active', createdAt: { $lt: startOfMonth } }),
      this.userModel.countDocuments({ role: 'collecteur', status: 'active' }),
      this.userModel.countDocuments({
        role: 'collecteur',
        status: 'active',
        createdAt: { $gte: startOfMonth },
      }),
      this.userModel.countDocuments({ role: 'recycleur', status: 'active' }),
      this.userModel.countDocuments({
        role: 'recycleur',
        status: 'active',
        createdAt: { $gte: startOfMonth },
      }),
      this.offerModel.aggregate([
        { $match: { status: { $in: ['active', 'verified', 'closed'] } } },
        { $group: { _id: '$plasticType', count: { $sum: 1 } } },
      ]),
    ]);

    const totalOffers = plasticTypes.reduce((s: number, p: any) => s + p.count, 0) || 1;
    const plasticTypeDistribution = plasticTypes.map((p: any) => ({
      type: p._id,
      count: p.count,
      percentage: Math.round((p.count / totalOffers) * 100),
    }));

    const kgRecycledThisMonth = await this.userModel.aggregate([
      { $match: { role: 'collecteur' } },
      { $group: { _id: null, total: { $sum: '$totalKgCollected' } } },
    ]);

    return {
      kgRecycledThisMonth: kgRecycledThisMonth[0]?.total || 0,
      activeOffers,
      activeOffersLastMonth,
      newCollectorsThisMonth: newCollectors,
      activeCollectors,
      newRecyclersThisMonth: newRecyclers,
      activeRecyclers,
      plasticTypeDistribution,
    };
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
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
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
    return this.userModel.aggregate([
      { $match: { role: 'collecteur', zone: { $exists: true, $ne: '' } } },
      { $group: { _id: '$zone', totalKg: { $sum: '$totalKgCollected' } } },
      { $sort: { totalKg: -1 } },
      { $limit: 10 },
      { $project: { zone: '$_id', totalKg: 1, _id: 0 } },
    ]);
  }
}
