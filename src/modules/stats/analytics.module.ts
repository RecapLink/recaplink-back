import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Offer, OfferSchema } from '../offers/schemas/offer.schema';
import { UserBadge, UserBadgeSchema } from '../badges/schemas/user-badge.schema';
import { Badge, BadgeSchema } from '../badges/schemas/badge.schema';
import { Knowledge, KnowledgeSchema } from '../knowledge/schemas/knowledge.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: UserBadge.name, schema: UserBadgeSchema },
      { name: Badge.name, schema: BadgeSchema },
      { name: Knowledge.name, schema: KnowledgeSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
