import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SecuritySettingsDocument = HydratedDocument<SecuritySettings>;

// `@Schema` + `SchemaFactory.createForClass` (not a bare class) so this nested object is a real
// Mongoose sub-schema — a bare class used as a `@Prop({ type })` degrades to `Mixed`, which silently
// drops its own fields' `default`s when the parent document is created without an explicit value.
@Schema({ _id: false })
class PasswordPolicy {
  @Prop({ default: 8 }) minLength: number;
  @Prop({ default: true }) requireUppercase: boolean;
  @Prop({ default: true }) requireNumber: boolean;
  @Prop({ default: false }) requireSpecialChar: boolean;
}
const PasswordPolicySchema = SchemaFactory.createForClass(PasswordPolicy);

@Schema({ timestamps: true })
export class SecuritySettings {
  @Prop({ default: 'singleton', unique: true })
  _key: string;

  @Prop({ default: '15m' })
  jwtExpiresIn: string;

  @Prop({ default: '7d' })
  refreshTokenExpiresIn: string;

  /** Idle timeout for a refresh-token session, in minutes. 0/undefined disables idle expiry. */
  @Prop({ default: 43200 })
  sessionTimeoutMinutes: number;

  @Prop({ default: 5 })
  maxLoginAttempts: number;

  @Prop({ default: 15 })
  lockoutDurationMinutes: number;

  @Prop({ type: PasswordPolicySchema, default: () => ({}) })
  passwordPolicy: PasswordPolicy;

  @Prop({ type: [String], default: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'] })
  allowedFileTypes: string[];

  @Prop({ default: 5 })
  maxUploadSizeMb: number;

  /** Requests per minute enforced on sensitive auth endpoints (login/refresh/forgot-password) by DynamicAuthThrottleGuard. */
  @Prop({ default: 20 })
  apiRateLimitPerMinute: number;
}

export const SecuritySettingsSchema = SchemaFactory.createForClass(SecuritySettings);
