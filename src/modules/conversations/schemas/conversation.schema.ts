import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Offer' })
  offer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage: Types.ObjectId;

  @Prop({ default: Date.now })
  lastActivityAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastActivityAt: -1 });
