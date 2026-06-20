import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserBadgeDocument = UserBadge & Document;

@Schema({ timestamps: true })
export class UserBadge {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) user: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Badge', required: true }) badge: Types.ObjectId;
  @Prop({ default: Date.now }) awardedAt: Date;
  @Prop({ default: 'manual' }) awardedBy: string;
}

export const UserBadgeSchema = SchemaFactory.createForClass(UserBadge);
UserBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });
UserBadgeSchema.index({ user: 1 });
