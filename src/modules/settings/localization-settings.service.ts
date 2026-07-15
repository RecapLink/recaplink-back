import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LocalizationSettings, LocalizationSettingsDocument } from './schemas/localization-settings.schema';
import { UpdateLocalizationSettingsDto } from './dto/update-localization-settings.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LocalizationSettingsService {
  constructor(
    @InjectModel(LocalizationSettings.name)
    private readonly model: Model<LocalizationSettingsDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async get(): Promise<LocalizationSettingsDocument> {
    const existing = await this.model.findOne({ _key: 'singleton' });
    return existing ?? this.model.create({ _key: 'singleton' });
  }

  async update(dto: UpdateLocalizationSettingsDto, adminId: string): Promise<LocalizationSettingsDocument> {
    await this.get();

    const doc = await this.model.findOneAndUpdate(
      { _key: 'singleton' },
      { $set: dto },
      { new: true },
    );

    await this.notificationsService.notifyAdmins({
      type: 'settings_updated',
      title: 'Paramètres mis à jour',
      message: 'Les paramètres de langue et région ont été modifiés',
      link: '/admin/settings',
      createdBy: adminId,
    });

    return doc;
  }
}
