import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { PlasticType } from '../../../common/enums/plastic-type.enum';
import { LegalStatus } from '../../../common/enums/legal-status.enum';
import { Language } from '../../../common/enums/language.enum';

// `@Schema` + `SchemaFactory.createForClass` (not a bare class) so these nested objects are real
// Mongoose sub-schemas — a bare class used as a `@Prop({ type })` degrades to `Mixed`, which silently
// drops its own fields' `default`s when the parent document is created without an explicit value.
@Schema({ _id: false })
class NotifPrefs {
  @Prop({ default: true }) newSignalement: boolean;
  @Prop({ default: true }) newInscription: boolean;
  @Prop({ default: true }) chatbotEscalade: boolean;
  @Prop({ default: true }) rapportsHebdo: boolean;
  @Prop({ default: false }) alertePerformance: boolean;
}
const NotifPrefsSchema = SchemaFactory.createForClass(NotifPrefs);

@Schema({ _id: false })
class DashboardPrefs {
  @Prop({ default: true }) soundEnabled: boolean;
  @Prop({ default: true }) desktopNotificationsEnabled: boolean;
}
const DashboardPrefsSchema = SchemaFactory.createForClass(DashboardPrefs);

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

  @Prop({ required: true, enum: LegalStatus, default: LegalStatus.PARTICULIER })
  legalStatus: LegalStatus;

  @Prop({ default: true })
  canBuy: boolean;

  @Prop({ default: true })
  canSell: boolean;

  @Prop({ trim: true })
  registreCommerce: string;

  @Prop({ trim: true })
  numeroFiscal: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ enum: Language, default: Language.FR })
  preferredLanguage: Language;

  @Prop({ trim: true })
  timezone: string;

  @Prop({ trim: true })
  position: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;

  @Prop({ type: NotifPrefsSchema, default: () => ({}) })
  notifPrefs: NotifPrefs;

  @Prop({ type: DashboardPrefsSchema, default: () => ({}) })
  dashboardPrefs: DashboardPrefs;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ default: null })
  lockedUntil: Date | null;

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

  @Prop()
  passwordResetToken: string;

  @Prop()
  passwordResetExpires: Date;

  // Not @Prop-decorated — these paths are already added to the schema by `{ timestamps: true }`
  // above. Declaring them as plain fields only gives TypeScript visibility into them.
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ zone: 1 });
UserSchema.index({ isDeleted: 1 });

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    // Legacy documents from before the multi-session rework may still carry this field in storage.
    delete (ret as unknown as Record<string, unknown>).refreshTokenHash;
    return ret;
  },
});
