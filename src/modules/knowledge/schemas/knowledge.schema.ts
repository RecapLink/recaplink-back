import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KnowledgeDocument = Knowledge & Document;

class I18nField {
  @Prop({ default: '' }) fr: string;
  @Prop({ default: '' }) ar: string;
  @Prop({ default: '' }) wo: string;
}

class Attachment {
  @Prop() name: string;
  @Prop() url: string;
  @Prop() mimeType: string;
}

class KnowledgeStep {
  @Prop({ type: I18nField }) title: I18nField;
  @Prop({ type: I18nField }) description: I18nField;
  @Prop({ default: 0 }) order: number;
  @Prop() imageUrl?: string;
}

@Schema({ timestamps: true })
export class Knowledge {
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ type: I18nField }) title: I18nField;
  @Prop({ type: I18nField }) subtitle?: I18nField;
  @Prop({ type: I18nField }) content: I18nField;
  @Prop({ required: true, enum: ['article', 'video', 'tutorial'] }) type: string;
  @Prop({ required: true }) category: string;
  @Prop({ enum: ['debutant', 'intermediaire', 'avance'] }) difficulty?: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop() coverImageUrl: string;
  @Prop() bannerUrl?: string;
  @Prop({ default: '#4d9538' }) coverColor: string;
  @Prop() videoUrl?: string;
  @Prop() pdfUrl?: string;
  @Prop({ type: [Attachment], default: [] }) attachments: Attachment[];
  @Prop({ type: [String], default: [] }) images: string[];
  @Prop({ default: 0 }) durationMinutes?: number;
  @Prop() seoTitle?: string;
  @Prop() seoDescription?: string;
  @Prop({ default: false }) recommended: boolean;
  @Prop({ default: false }) pinned: boolean;
  @Prop({ default: 0 }) pinOrder: number;
  @Prop({ type: [KnowledgeStep], default: [] }) steps: KnowledgeStep[];
  @Prop() publishedAt?: Date;
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
KnowledgeSchema.index({ status: 1, publishedAt: -1 });
KnowledgeSchema.index({ pinned: 1, pinOrder: 1 });
KnowledgeSchema.index({ recommended: 1, status: 1 });
