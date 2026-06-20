import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ enum: ['offer', 'user', 'message'], required: true }) type: string;
  @Prop({ type: Types.ObjectId, required: true }) targetId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) reporter: Types.ObjectId;
  @Prop({ required: true }) reason: string;
  @Prop({ enum: ['pending', 'reviewed', 'dismissed', 'action_taken'], default: 'pending' })
  status: string;
  @Prop() adminNote: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) reviewedBy: Types.ObjectId;
  @Prop() reviewedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ status: 1, type: 1 });
