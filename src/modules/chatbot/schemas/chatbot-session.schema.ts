import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatbotSessionDocument = ChatbotSession & Document;

class ChatMessage {
  @Prop({ enum: ['user', 'assistant'], required: true }) role: string;
  @Prop({ required: true }) content: string;
  @Prop({ default: Date.now }) timestamp: Date;
}

@Schema({ timestamps: true })
export class ChatbotSession {
  @Prop({ type: Types.ObjectId, ref: 'User' }) user: Types.ObjectId;
  @Prop({ type: [ChatMessage], default: [] }) messages: ChatMessage[];
  @Prop({ default: false }) escalated: boolean;
  @Prop() escalatedAt: Date;
  @Prop({ enum: ['active', 'resolved', 'escalated'], default: 'active' }) status: string;
}

export const ChatbotSessionSchema = SchemaFactory.createForClass(ChatbotSession);
ChatbotSessionSchema.index({ user: 1 });
ChatbotSessionSchema.index({ escalated: 1 });
