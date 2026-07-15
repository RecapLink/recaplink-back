import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocalizationSettings, LocalizationSettingsSchema } from './schemas/localization-settings.schema';
import { SecuritySettings, SecuritySettingsSchema } from './schemas/security-settings.schema';
import { LocalizationSettingsService } from './localization-settings.service';
import { SecuritySettingsService } from './security-settings.service';
import { SettingsController } from './settings.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LocalizationSettings.name, schema: LocalizationSettingsSchema },
      { name: SecuritySettings.name, schema: SecuritySettingsSchema },
    ]),
    NotificationsModule,
    SessionsModule,
  ],
  controllers: [SettingsController],
  providers: [LocalizationSettingsService, SecuritySettingsService],
  exports: [LocalizationSettingsService, SecuritySettingsService],
})
export class SettingsModule {}
