import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BadgeDocument = Badge & Document;

class I18nField {
  @Prop({ default: '' }) fr: string;
  @Prop({ default: '' }) ar: string;
  @Prop({ default: '' }) wo: string;
}

@Schema({ timestamps: true })
export class Badge {
  @Prop({ type: I18nField }) name: I18nField;
  @Prop({ type: I18nField }) description: I18nField;
  @Prop() iconUrl: string;
  @Prop({ enum: ['expert', 'pioneer', 'administrator', 'volume', 'activity'], default: 'activity' })
  category: string;
  @Prop({ enum: ['kg_collected', 'offers_completed', 'days_active', 'manual'], default: 'manual' })
  criteriaType: string;
  @Prop({ default: 0 }) criteriaValue: number;
  @Prop({ default: false }) autoAssign: boolean;
  @Prop({ default: 0 }) userCount: number;
}

export const BadgeSchema = SchemaFactory.createForClass(Badge);
