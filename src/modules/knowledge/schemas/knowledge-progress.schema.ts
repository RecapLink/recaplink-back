import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KnowledgeProgressDocument = KnowledgeProgress & Document;

@Schema({ timestamps: true })
export class KnowledgeProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) user: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Knowledge', required: true }) knowledge: Types.ObjectId;
  @Prop({ enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' }) status: string;
  @Prop({ min: 0, max: 100, default: 0 }) progressPercent: number;
  @Prop({ default: 0 }) currentStep: number;
  @Prop({ type: [Number], default: [] }) completedSteps: number[];
  @Prop() startedAt?: Date;
  @Prop({ default: Date.now }) lastOpenedAt: Date;
  @Prop() completedAt?: Date;
}

export const KnowledgeProgressSchema = SchemaFactory.createForClass(KnowledgeProgress);
KnowledgeProgressSchema.index({ user: 1, knowledge: 1 }, { unique: true });
KnowledgeProgressSchema.index({ user: 1, status: 1 });
