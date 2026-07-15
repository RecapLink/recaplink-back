import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationSettingsService } from './notification-settings.service';

@Injectable()
export class NotificationsRetentionCron {
  private readonly logger = new Logger(NotificationsRetentionCron.name);

  constructor(
    @InjectModel(Notification.name) private readonly model: Model<NotificationDocument>,
    private readonly settingsService: NotificationSettingsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async purgeExpired(): Promise<void> {
    const settings = await this.settingsService.getPolicy();
    if (!settings.retentionDays) return;

    const cutoff = new Date(Date.now() - settings.retentionDays * 24 * 60 * 60 * 1000);
    const { deletedCount } = await this.model.deleteMany({ createdAt: { $lt: cutoff } });
    if (deletedCount) this.logger.log(`Purged ${deletedCount} notifications older than ${settings.retentionDays} days`);
  }
}
