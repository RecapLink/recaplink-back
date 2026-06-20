import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KnowledgeDocument = Knowledge & Document;

class I18nField {
  @Prop({ default: '' }) fr: string;
  @Prop({ default: '' }) ar: string;
  @Prop({ default: '' }) wo: string;
}

@Schema({ timestamps: true })
export class Knowledge {
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ type: I18nField }) title: I18nField;
  @Prop({ type: I18nField }) content: I18nField;
  @Prop({ required: true, enum: ['article', 'video', 'tutorial'] }) type: string;
  @Prop({ required: true }) category: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop() coverImageUrl: string;
  @Prop({ default: '#4d9538' }) coverColor: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) author: Types.ObjectId;
  @Prop({ enum: ['draft', 'published', 'archived'], default: 'draft' }) status: string;
  @Prop({ default: 0 }) viewCount: number;
  @Prop({ default: 0 }) likeCount: number;
  @Prop({ default: 0 }) stepCount: number;
  @Prop() videoDuration: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] }) likedBy: Types.ObjectId[];
}

export const KnowledgeSchema = SchemaFactory.createForClass(Knowledge);
KnowledgeSchema.index({ slug: 1 }, { unique: true });
KnowledgeSchema.index({ type: 1, status: 1 });
KnowledgeSchema.index({ category: 1 });
