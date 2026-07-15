import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Language } from '../../../common/enums/language.enum';

export type LocalizationSettingsDocument = HydratedDocument<LocalizationSettings>;

@Schema({ timestamps: true })
export class LocalizationSettings {
  @Prop({ default: 'singleton', unique: true })
  _key: string;

  @Prop({ enum: Language, default: Language.FR })
  defaultLanguage: Language;

  @Prop({ type: [String], enum: Language, default: [Language.FR, Language.AR, Language.WO] })
  availableLanguages: Language[];

  @Prop({ default: 'TN' })
  defaultCountry: string;

  @Prop({ default: 'Africa/Tunis' })
  timezone: string;

  @Prop({ default: 'DD/MM/YYYY' })
  dateFormat: string;

  @Prop({ default: 'fr-TN' })
  numberFormat: string;

  @Prop({ default: 'TND' })
  currency: string;
}

export const LocalizationSettingsSchema = SchemaFactory.createForClass(LocalizationSettings);
