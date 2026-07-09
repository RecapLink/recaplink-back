import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LearningPathDocument = LearningPath & Document;

class I18nField {
  @Prop({ default: '' }) fr: string;
  @Prop({ default: '' }) ar: string;
  @Prop({ default: '' }) wo: string;
}

class LearningPathItem {
  @Prop({ type: Types.ObjectId, ref: 'Knowledge', required: true }) knowledge: Types.ObjectId;
  @Prop({ default: 0 }) order: number;
}

@Schema({ timestamps: true })
export class LearningPath {
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ type: I18nField }) title: I18nField;
  @Prop({ type: I18nField }) description?: I18nField;
  @Prop({ type: [LearningPathItem], default: [] }) items: LearningPathItem[];
  @Prop({ type: Types.ObjectId, ref: 'Badge' }) badge?: Types.ObjectId;
  @Prop({ enum: ['draft', 'published'], default: 'draft' }) status: string;
  @Prop() coverImageUrl?: string;
}

export const LearningPathSchema = SchemaFactory.createForClass(LearningPath);
LearningPathSchema.index({ slug: 1 }, { unique: true });
LearningPathSchema.index({ status: 1 });
