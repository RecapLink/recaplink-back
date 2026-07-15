import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BadgeEngineSettingsDocument = HydratedDocument<BadgeEngineSettings>;

// `@Schema` + `SchemaFactory.createForClass` (not a bare class) so this nested object is a real
// Mongoose sub-schema — a bare class used as a `@Prop({ type })` degrades to `Mixed`, which silently
// drops its own fields' `default`s when the parent document is created without an explicit value.
@Schema({ _id: false })
class LastRunStats {
  @Prop({ default: 0 }) scanned: number;
  @Prop({ default: 0 }) awarded: number;
}
const LastRunStatsSchema = SchemaFactory.createForClass(LastRunStats);

@Schema({ timestamps: true })
export class BadgeEngineSettings {
  @Prop({ default: 'singleton', unique: true })
  _key: string;

  @Prop({ default: true })
  autoBadgesEnabled: boolean;

  @Prop({ enum: ['hourly', 'daily', 'weekly', 'manual'], default: 'daily' })
  recalculationFrequency: string;

  @Prop({ default: true })
  manualOverrideAllowed: boolean;

  @Prop({ default: null })
  lastRunAt: Date | null;

  @Prop({ type: LastRunStatsSchema, default: () => ({}) })
  lastRunStats: LastRunStats;
}

export const BadgeEngineSettingsSchema = SchemaFactory.createForClass(BadgeEngineSettings);
