import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationSettings, NotificationSettingsSchema } from './schemas/notification-settings.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsController } from './notifications.controller';
import { NotificationSettingsController } from './notification-settings.controller';
import { NotificationsRetentionCron } from './notifications-retention.cron';
import { MessagingModule } from '../conversations/messaging.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationSettings.name, schema: NotificationSettingsSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MessagingModule,
    EmailModule,
  ],
  controllers: [NotificationsController, NotificationSettingsController],
  providers: [NotificationsService, NotificationSettingsService, NotificationsRepository, NotificationsRetentionCron],
  exports: [NotificationsService, NotificationSettingsService],
})
export class NotificationsModule {}
