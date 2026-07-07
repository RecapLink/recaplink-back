import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReportReason } from '../../../common/enums/report-reason.enum';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'Offer', required: true, index: true })
  offerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedBy: Types.ObjectId;

  @Prop({ enum: ReportReason, required: true })
  reason: ReportReason;

  @Prop()
  comment?: string;

  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  decisionComment?: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ offerId: 1, status: 1 });
ReportSchema.index({ status: 1, createdAt: -1 });
