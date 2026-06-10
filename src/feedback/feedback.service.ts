import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
  ) {}

  async create(dto: CreateFeedbackDto): Promise<Feedback> {
    return new this.feedbackModel(dto).save();
  }

  async findAll(): Promise<Feedback[]> {
    return this.feedbackModel.find().sort({ createdAt: -1 }).exec();
  }

  async getStats() {
    const all = await this.feedbackModel.find().lean().exec();
    const total = all.length;

    if (total === 0) {
      return {
        total: 0,
        averageSatisfaction: 0,
        satisfactionDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        profileDistribution: {},
        wouldUseDistribution: {},
        heardFromDistribution: {},
        featuresDistribution: {},
        languageDistribution: {},
        recentTrend: this.emptyTrend(),
      };
    }

    const withSatisfaction = all.filter((f) => f.satisfaction != null);
    const averageSatisfaction =
      withSatisfaction.length > 0
        ? withSatisfaction.reduce((sum, f) => sum + (f.satisfaction as number), 0) /
          withSatisfaction.length
        : 0;

    const satisfactionDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    withSatisfaction.forEach((f) => {
      const s = f.satisfaction as number;
      if (s >= 1 && s <= 5) satisfactionDistribution[s]++;
    });

    const featuresDistribution: Record<string, number> = {};
    all.forEach((f) => {
      if (Array.isArray(f.features)) {
        (f.features as string[]).forEach((feat) => {
          featuresDistribution[feat] = (featuresDistribution[feat] || 0) + 1;
        });
      }
    });

    const trendMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      trendMap[d.toISOString().slice(0, 10)] = 0;
    }
    all.forEach((f: any) => {
      const key = new Date(f.createdAt).toISOString().slice(0, 10);
      if (key in trendMap) trendMap[key]++;
    });

    return {
      total,
      averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
      satisfactionDistribution,
      profileDistribution: this.countField(all, 'profile'),
      wouldUseDistribution: this.countField(all, 'wouldUse'),
      heardFromDistribution: this.countField(all, 'heardFrom'),
      featuresDistribution,
      languageDistribution: this.countField(all, 'language'),
      recentTrend: Object.entries(trendMap).map(([date, count]) => ({ date, count })),
    };
  }

  private countField(items: any[], field: string): Record<string, number> {
    const dist: Record<string, number> = {};
    items.forEach((item) => {
      const val = item[field];
      if (val) dist[val] = (dist[val] || 0) + 1;
    });
    return dist;
  }

  private emptyTrend() {
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      return { date: d.toISOString().slice(0, 10), count: 0 };
    });
  }
}
