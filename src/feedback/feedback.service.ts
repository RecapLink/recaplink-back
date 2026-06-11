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
        averageDesignRating: 0,
        designRatingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        colorSchemeDistribution: {},
        textReadabilityDistribution: {},
        navIntuitionDistribution: {},
        savoirFaireDistribution: {},
        complexityDistribution: {},
        onboardingDistribution: {},
        registrationEaseDistribution: {},
        postOfferEaseDistribution: {},
        searchCollectorEaseDistribution: {},
        averageMessagingRating: 0,
        messagingRatingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageChatbotRating: 0,
        chatbotRatingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        badgeSatisfactionDistribution: {},
        profilePageDistribution: {},
        favoriteFeatureDistribution: {} as Record<string, number>,
        usageFrequencyDistribution: {},
        wouldRecommendDistribution: {},
        languageDistribution: {},
        recentTrend: this.emptyTrend(),
      };
    }

    return {
      total,
      averageSatisfaction: this.avgField(all, 'satisfaction'),
      satisfactionDistribution: this.starDist(all, 'satisfaction'),
      averageDesignRating: this.avgField(all, 'designRating'),
      designRatingDistribution: this.starDist(all, 'designRating'),
      colorSchemeDistribution: this.countField(all, 'colorScheme'),
      textReadabilityDistribution: this.countField(all, 'textReadability'),
      navIntuitionDistribution: this.countField(all, 'navIntuition'),
      savoirFaireDistribution: this.countField(all, 'savoirFaire'),
      complexityDistribution: this.countField(all, 'complexity'),
      onboardingDistribution: this.countField(all, 'onboarding'),
      registrationEaseDistribution: this.countField(all, 'registrationEase'),
      postOfferEaseDistribution: this.countField(all, 'postOfferEase'),
      searchCollectorEaseDistribution: this.countField(all, 'searchCollectorEase'),
      averageMessagingRating: this.avgField(all, 'messagingRating'),
      messagingRatingDistribution: this.starDist(all, 'messagingRating'),
      averageChatbotRating: this.avgField(all, 'chatbotRating'),
      chatbotRatingDistribution: this.starDist(all, 'chatbotRating'),
      badgeSatisfactionDistribution: this.countField(all, 'badgeSatisfaction'),
      profilePageDistribution: this.countField(all, 'profilePage'),
      favoriteFeatureDistribution: this.countArrayField(all, 'favoriteFeature'),
      usageFrequencyDistribution: this.countField(all, 'usageFrequency'),
      wouldRecommendDistribution: this.countField(all, 'wouldRecommend'),
      languageDistribution: this.countField(all, 'language'),
      recentTrend: this.buildTrend(all),
    };
  }

  private avgField(items: any[], field: string): number {
    const valid = items.filter((i) => i[field] != null && i[field] > 0);
    if (!valid.length) return 0;
    const sum = valid.reduce((s, i) => s + (i[field] as number), 0);
    return Math.round((sum / valid.length) * 10) / 10;
  }

  private starDist(items: any[], field: string): Record<number, number> {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    items.forEach((i) => {
      const v = i[field] as number;
      if (v >= 1 && v <= 5) dist[v]++;
    });
    return dist;
  }

  private countField(items: any[], field: string): Record<string, number> {
    const dist: Record<string, number> = {};
    items.forEach((item) => {
      const val = item[field];
      if (val) dist[val] = (dist[val] || 0) + 1;
    });
    return dist;
  }

  private countArrayField(items: any[], field: string): Record<string, number> {
    const dist: Record<string, number> = {};
    items.forEach((item) => {
      const val = item[field];
      if (Array.isArray(val)) {
        val.forEach((v: string) => { if (v) dist[v] = (dist[v] || 0) + 1; });
      } else if (val) {
        dist[val] = (dist[val] || 0) + 1;
      }
    });
    return dist;
  }

  private buildTrend(items: any[]) {
    const trendMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      trendMap[d.toISOString().slice(0, 10)] = 0;
    }
    items.forEach((f: any) => {
      const key = new Date(f.createdAt).toISOString().slice(0, 10);
      if (key in trendMap) trendMap[key]++;
    });
    return Object.entries(trendMap).map(([date, count]) => ({ date, count }));
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
