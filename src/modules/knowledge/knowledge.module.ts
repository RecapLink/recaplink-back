import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Knowledge, KnowledgeSchema } from './schemas/knowledge.schema';
import { KnowledgeCategory, KnowledgeCategorySchema } from './schemas/knowledge-category.schema';
import { KnowledgeView, KnowledgeViewSchema } from './schemas/knowledge-view.schema';
import { KnowledgeProgress, KnowledgeProgressSchema } from './schemas/knowledge-progress.schema';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeCategoryService } from './knowledge-category.service';
import { KnowledgeProgressService } from './knowledge-progress.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeCategoryController } from './knowledge-category.controller';
import { KnowledgeStatsController } from './knowledge-stats.controller';
import { KnowledgeProgressController } from './knowledge-progress.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Knowledge.name, schema: KnowledgeSchema },
      { name: KnowledgeCategory.name, schema: KnowledgeCategorySchema },
      { name: KnowledgeView.name, schema: KnowledgeViewSchema },
      { name: KnowledgeProgress.name, schema: KnowledgeProgressSchema },
    ]),
    NotificationsModule,
    BadgesModule,
  ],
  // Order is load-bearing: KnowledgeController has a public `GET :slug` wildcard
  // route that would otherwise swallow `/knowledge/categories`, `/knowledge/statistics`,
  // and `/knowledge/progress` — those controllers MUST be registered first.
  controllers: [
    KnowledgeCategoryController,
    KnowledgeStatsController,
    KnowledgeProgressController,
    KnowledgeController,
  ],
  providers: [KnowledgeService, KnowledgeCategoryService, KnowledgeProgressService],
  exports: [KnowledgeService, KnowledgeCategoryService, KnowledgeProgressService],
})
export class KnowledgeModule {}
