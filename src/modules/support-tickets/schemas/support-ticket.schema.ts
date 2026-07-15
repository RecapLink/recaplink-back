import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';
import { TicketCategory, TicketPriority, TicketStatus } from '../enums';

export type SupportTicketDocument = SupportTicket & Document;

class TicketMessage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) author: Types.ObjectId;
  @Prop({ enum: Role, required: true }) authorRole: Role;
  @Prop({ required: true }) body: string;
  @Prop() attachmentUrl?: string;
  @Prop({ default: Date.now }) createdAt: Date;
}

@Schema({ timestamps: true })
export class SupportTicket {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ enum: TicketCategory, required: true })
  category: TicketCategory;

  @Prop({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Prop({ required: true })
  description: string;

  @Prop()
  screenshotUrl?: string;

  @Prop({ enum: TicketStatus, default: TicketStatus.OPEN, index: true })
  status: TicketStatus;

  @Prop({ type: [TicketMessage], default: [] })
  messages: TicketMessage[];
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
SupportTicketSchema.index({ createdBy: 1, status: 1 });
SupportTicketSchema.index({ status: 1, createdAt: -1 });
