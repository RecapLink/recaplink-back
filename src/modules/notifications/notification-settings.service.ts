import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationSettings, NotificationSettingsDocument } from './schemas/notification-settings.schema';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Injectable()
export class NotificationSettingsService {
  constructor(
    @InjectModel(NotificationSettings.name)
    private readonly model: Model<NotificationSettingsDocument>,
  ) {}

  /**
   * Find-then-create (not upsert) so Mongoose runs full nested-subdocument default construction
   * (e.g. `channels`) — `findOneAndUpdate` with `$setOnInsert` does not apply those defaults.
   */
  async getPolicy(): Promise<NotificationSettingsDocument> {
    const existing = await this.model.findOne({ _key: 'singleton' });
    return existing ?? this.model.create({ _key: 'singleton' });
  }

  async update(dto: UpdateNotificationSettingsDto): Promise<NotificationSettingsDocument> {
    await this.getPolicy();

    const update: Record<string, unknown> = {};
    if (dto.channels) update.channels = dto.channels;
    if (dto.categories) update.categories = dto.categories;
    if (dto.retentionDays !== undefined) update.retentionDays = dto.retentionDays;
    if (dto.realtimeEnabled !== undefined) update.realtimeEnabled = dto.realtimeEnabled;
    if (dto.templates) update.templates = dto.templates;

    return this.model.findOneAndUpdate(
      { _key: 'singleton' },
      { $set: update },
      { new: true },
    );
  }

  isCategoryEnabled(settings: NotificationSettingsDocument, category: string): boolean {
    const entry = settings.categories?.find(c => c.category === category);
    return entry ? entry.enabled : true;
  }

  findTemplate(settings: NotificationSettingsDocument, type: string) {
    return settings.templates?.find(t => t.type === type);
  }
}
