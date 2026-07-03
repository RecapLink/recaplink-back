import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SiteSettings, SiteSettingsDocument } from './schemas/site-settings.schema';
import { UpdateSupportSettingsDto } from './dto/update-support-settings.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectModel(SiteSettings.name)
    private readonly model: Model<SiteSettingsDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private toSupportDto(doc: SiteSettingsDocument) {
    return {
      enabled: doc.supportEnabled,
      title: doc.supportTitle,
      startHour: doc.supportStartHour,
      endHour: doc.supportEndHour,
      phone: doc.supportPhone,
      email: doc.supportEmail,
      illustration: doc.supportIllustration,
      bubbleColor: doc.supportBubbleColor,
    };
  }

  async getSupportSettings() {
    const doc = await this.model.findOneAndUpdate(
      { _key: 'singleton' },
      { $setOnInsert: { _key: 'singleton' } },
      { upsert: true, new: true },
    );
    return this.toSupportDto(doc);
  }

  async updateSupportSettings(dto: UpdateSupportSettingsDto, adminId: string) {
    const update: Partial<SiteSettings> = {};
    if (dto.supportEnabled !== undefined) update.supportEnabled = dto.supportEnabled;
    if (dto.supportTitle !== undefined) update.supportTitle = dto.supportTitle;
    if (dto.supportStartHour !== undefined) update.supportStartHour = dto.supportStartHour;
    if (dto.supportEndHour !== undefined) update.supportEndHour = dto.supportEndHour;
    if (dto.supportPhone !== undefined) update.supportPhone = dto.supportPhone;
    if (dto.supportEmail !== undefined) update.supportEmail = dto.supportEmail;
    if (dto.supportIllustration !== undefined) update.supportIllustration = dto.supportIllustration;
    if (dto.supportBubbleColor !== undefined) update.supportBubbleColor = dto.supportBubbleColor;

    const doc = await this.model.findOneAndUpdate(
      { _key: 'singleton' },
      { $set: update },
      { upsert: true, new: true },
    );

    await this.notificationsService.notifyAdmins({
      type: 'system',
      title: 'Paramètres mis à jour',
      body: 'Les paramètres du widget d\'assistance ont été modifiés',
      link: '/admin/settings',
      excludeUserId: adminId,
    });

    return this.toSupportDto(doc);
  }
}
