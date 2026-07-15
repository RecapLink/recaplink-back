import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Language } from '../../../common/enums/language.enum';

export type ChatbotSettingsDocument = HydratedDocument<ChatbotSettings>;

// `@Schema` + `SchemaFactory.createForClass` (not a bare class) so these nested objects are real
// Mongoose sub-schemas — a bare class used as a `@Prop({ type })` degrades to `Mixed`, which silently
// drops its own fields' `default`s when the parent document is created without an explicit value.
@Schema({ _id: false })
class LocalizedMessage {
  @Prop({ default: 'Bonjour ! Je suis l\'assistant RecapLink, comment puis-je vous aider ?' }) fr: string;
  @Prop({ default: '' }) ar: string;
  @Prop({ default: '' }) wo: string;
}
const LocalizedMessageSchema = SchemaFactory.createForClass(LocalizedMessage);

@Schema({ _id: false })
class LocalizedFallback {
  @Prop({ default: 'Merci pour votre question ! Pouvez-vous préciser votre demande ?' }) fr: string;
  @Prop({ default: '' }) ar: string;
  @Prop({ default: '' }) wo: string;
}
const LocalizedFallbackSchema = SchemaFactory.createForClass(LocalizedFallback);

@Schema({ timestamps: true })
export class ChatbotSettings {
  @Prop({ default: 'singleton', unique: true })
  _key: string;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: 'internal' })
  aiProvider: string;

  @Prop({ default: 'keyword-engine-v1' })
  model: string;

  @Prop({ default: 0.7, min: 0, max: 2 })
  temperature: number;

  @Prop({ default: 300, min: 1 })
  maxTokens: number;

  @Prop({ type: [String], enum: Language, default: [Language.FR] })
  supportedLanguages: Language[];

  @Prop({ type: LocalizedMessageSchema, default: () => ({}) })
  greetingMessage: LocalizedMessage;

  @Prop({ type: LocalizedFallbackSchema, default: () => ({}) })
  fallbackMessage: LocalizedFallback;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Knowledge' }], default: [] })
  knowledgeSourceIds: Types.ObjectId[];

  @Prop({ default: true })
  moderationEnabled: boolean;

  @Prop({
    type: [String],
    default: ['humain', 'agent', 'parler', 'urgent', 'problème', 'aide', 'legal', 'juridique'],
  })
  moderationKeywords: string[];

  @Prop({ default: true })
  analyticsEnabled: boolean;
}

export const ChatbotSettingsSchema = SchemaFactory.createForClass(ChatbotSettings);
