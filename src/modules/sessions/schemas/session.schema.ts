import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  refreshTokenHash: string;

  @Prop({ default: '' })
  userAgent: string;

  @Prop({ default: 'Appareil inconnu' })
  deviceLabel: string;

  @Prop({ default: '' })
  ip: string;

  @Prop({ default: Date.now })
  lastActiveAt: Date;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isTrusted: boolean;

  @Prop({ default: null })
  revokedAt: Date | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ user: 1, revokedAt: 1 });
SessionSchema.index({ expiresAt: 1 });

SessionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.refreshTokenHash;
    return ret;
  },
});
