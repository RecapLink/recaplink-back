import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SiteSettingsDocument = HydratedDocument<SiteSettings>;

@Schema({ timestamps: true })
export class SiteSettings {
  @Prop({ default: 'singleton', unique: true })
  _key: string;

  @Prop({ default: true })
  supportEnabled: boolean;

  @Prop({ default: 'Assistance disponible de {startHour} à {endHour} au' })
  supportTitle: string;

  @Prop({ default: '9h' })
  supportStartHour: string;

  @Prop({ default: '17h' })
  supportEndHour: string;

  @Prop({ default: '52.056.778' })
  supportPhone: string;

  @Prop({ default: '' })
  supportEmail: string;

  @Prop({ default: '' })
  supportIllustration: string;

  @Prop({ default: '#4d9538' })
  supportBubbleColor: string;
}

export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);
