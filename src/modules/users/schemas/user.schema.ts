import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { PlasticType } from '../../../common/enums/plastic-type.enum';

class NotifPrefs {
  @Prop({ default: true }) newSignalement: boolean;
  @Prop({ default: true }) newInscription: boolean;
  @Prop({ default: true }) chatbotEscalade: boolean;
  @Prop({ default: true }) rapportsHebdo: boolean;
  @Prop({ default: false }) alertePerformance: boolean;
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  username: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ trim: true })
  phone: string;

  @Prop()
  avatarUrl: string;

  @Prop({ required: true, enum: Role })
  role: Role;

  @Prop({ enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Prop({ trim: true })
  zone: string;

  @Prop({ trim: true })
  city: string;

  @Prop({ trim: true })
  bio: string;

  @Prop({ type: [String], enum: PlasticType, default: [] })
  plasticTypes: PlasticType[];

  @Prop()
  refreshTokenHash: string;

  @Prop({ type: NotifPrefs, default: () => ({}) })
  notifPrefs: NotifPrefs;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Badge' }], default: [] })
  badges: Types.ObjectId[];

  @Prop({ default: 0 })
  totalKgCollected: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop()
  lastActiveAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ zone: 1 });

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.refreshTokenHash;
    return ret;
  },
});
