import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { NotificationCategory } from '../notification-types';

export type NotificationSettingsDocument = HydratedDocument<NotificationSettings>;

const ALL_CATEGORIES: NotificationCategory[] = ['users', 'offers', 'knowledge', 'badges', 'settings', 'reports', 'system'];

// `@Schema` + `SchemaFactory.createForClass` (not a bare class) so this nested object is a real
// Mongoose sub-schema — a bare class used as a `@Prop({ type })` degrades to `Mixed`, which silently
// drops its own fields' `default`s when the parent document is created without an explicit value.
@Schema({ _id: false })
class ChannelToggles {
  @Prop({ default: true }) email: boolean;
  @Prop({ default: true }) dashboard: boolean;
  @Prop({ default: true }) mobile: boolean;
  /** Stored for future use — no FCM/APNs integration exists yet, so this toggle has no runtime effect today. */
  @Prop({ default: false }) push: boolean;
}
const ChannelTogglesSchema = SchemaFactory.createForClass(ChannelToggles);

class CategoryToggle {
  @Prop({ required: true }) category: string;
  @Prop({ default: true }) enabled: boolean;
}

export class NotificationTemplate {
  @Prop({ required: true }) type: string;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) message: string;
}

@Schema({ timestamps: true })
export class NotificationSettings {
  @Prop({ default: 'singleton', unique: true })
  _key: string;

  @Prop({ type: ChannelTogglesSchema, default: () => ({}) })
  channels: ChannelToggles;

  @Prop({
    type: [CategoryToggle],
    default: () => ALL_CATEGORIES.map(category => ({ category, enabled: true })),
  })
  categories: CategoryToggle[];

  @Prop({ default: 90 })
  retentionDays: number;

  @Prop({ default: true })
  realtimeEnabled: boolean;

  @Prop({ type: [NotificationTemplate], default: [] })
  templates: NotificationTemplate[];
}

export const NotificationSettingsSchema = SchemaFactory.createForClass(NotificationSettings);
