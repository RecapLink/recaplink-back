import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotSession, ChatbotSessionSchema } from './schemas/chatbot-session.schema';
import { ChatbotSettings, ChatbotSettingsSchema } from './schemas/chatbot-settings.schema';
import { Knowledge, KnowledgeSchema } from '../knowledge/schemas/knowledge.schema';
import { ChatbotService } from './chatbot.service';
import { ChatbotSettingsService } from './chatbot-settings.service';
import { ChatbotController } from './chatbot.controller';
import { ChatbotSettingsController } from './chatbot-settings.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatbotSession.name, schema: ChatbotSessionSchema },
      { name: ChatbotSettings.name, schema: ChatbotSettingsSchema },
      { name: Knowledge.name, schema: KnowledgeSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ChatbotController, ChatbotSettingsController],
  providers: [ChatbotService, ChatbotSettingsService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
