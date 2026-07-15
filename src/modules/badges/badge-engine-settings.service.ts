import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BadgeEngineSettings, BadgeEngineSettingsDocument } from './schemas/badge-engine-settings.schema';
import { UpdateBadgeEngineSettingsDto } from './dto/update-badge-engine-settings.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BadgeEngineSettingsService {
  constructor(
    @InjectModel(BadgeEngineSettings.name) private readonly model: Model<BadgeEngineSettingsDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Find-then-create (not upsert) so Mongoose runs full nested-subdocument default construction
   * (e.g. `lastRunStats`) — `findOneAndUpdate` with `$setOnInsert` does not apply those defaults.
   */
  async getPolicy(): Promise<BadgeEngineSettingsDocument> {
    const existing = await this.model.findOne({ _key: 'singleton' });
    return existing ?? this.model.create({ _key: 'singleton' });
  }

  async update(dto: UpdateBadgeEngineSettingsDto, adminId: string): Promise<BadgeEngineSettingsDocument> {
    await this.getPolicy();

    const doc = await this.model.findOneAndUpdate(
      { _key: 'singleton' },
      { $set: dto },
      { new: true },
    );

    await this.notificationsService.notifyAdmins({
      type: 'settings_updated',
      title: 'Paramètres mis à jour',
      message: "Les paramètres du moteur de badges automatiques ont été modifiés",
      link: '/admin/settings',
      createdBy: adminId,
    });

    return doc;
  }

  async recordRun(stats: { scanned: number; awarded: number }): Promise<void> {
    await this.model.updateOne(
      { _key: 'singleton' },
      { $set: { lastRunAt: new Date(), lastRunStats: stats } },
      { upsert: true },
    );
  }
}
