import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotSession, ChatbotSessionSchema } from './schemas/chatbot-session.schema';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChatbotSession.name, schema: ChatbotSessionSchema }]),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
