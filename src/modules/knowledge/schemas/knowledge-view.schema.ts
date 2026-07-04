import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KnowledgeViewDocument = KnowledgeView & Document;

@Schema()
export class KnowledgeView {
  @Prop({ type: Types.ObjectId, ref: 'Knowledge', required: true, index: true }) knowledge: Types.ObjectId;
  @Prop({ default: Date.now, index: true }) viewedAt: Date;
}

export const KnowledgeViewSchema = SchemaFactory.createForClass(KnowledgeView);
KnowledgeViewSchema.index({ knowledge: 1, viewedAt: -1 });
KnowledgeViewSchema.index({ viewedAt: -1 });
