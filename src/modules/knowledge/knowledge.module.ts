import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Knowledge, KnowledgeSchema } from './schemas/knowledge.schema';
import { KnowledgeCategory, KnowledgeCategorySchema } from './schemas/knowledge-category.schema';
import { KnowledgeView, KnowledgeViewSchema } from './schemas/knowledge-view.schema';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeCategoryService } from './knowledge-category.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeCategoryController } from './knowledge-category.controller';
import { KnowledgeStatsController } from './knowledge-stats.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Knowledge.name, schema: KnowledgeSchema },
      { name: KnowledgeCategory.name, schema: KnowledgeCategorySchema },
      { name: KnowledgeView.name, schema: KnowledgeViewSchema },
    ]),
    NotificationsModule,
  ],
  // Order is load-bearing: KnowledgeController has a public `GET :slug` wildcard
  // route that would otherwise swallow `/knowledge/categories` and
  // `/knowledge/statistics` — those two controllers MUST be registered first.
  controllers: [KnowledgeCategoryController, KnowledgeStatsController, KnowledgeController],
  providers: [KnowledgeService, KnowledgeCategoryService],
  exports: [KnowledgeService, KnowledgeCategoryService],
})
export class KnowledgeModule {}
