import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KnowledgeCategoryDocument = KnowledgeCategory & Document;

@Schema({ timestamps: true })
export class KnowledgeCategory {
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ required: true }) label: string;
  @Prop({ default: '#4d9538' }) color: string;
}

export const KnowledgeCategorySchema = SchemaFactory.createForClass(KnowledgeCategory);
KnowledgeCategorySchema.index({ slug: 1 }, { unique: true });
