import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LearningPath, LearningPathSchema } from './schemas/learning-path.schema';
import { LearningPathsService } from './learning-paths.service';
import { LearningPathsController } from './learning-paths.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LearningPath.name, schema: LearningPathSchema }]),
    NotificationsModule,
    KnowledgeModule,
  ],
  controllers: [LearningPathsController],
  providers: [LearningPathsService],
  exports: [LearningPathsService],
})
export class LearningPathsModule {}
