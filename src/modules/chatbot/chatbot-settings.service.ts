import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatbotSettings, ChatbotSettingsDocument } from './schemas/chatbot-settings.schema';
import { UpdateChatbotSettingsDto } from './dto/update-chatbot-settings.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatbotSettingsService {
  constructor(
    @InjectModel(ChatbotSettings.name) private readonly model: Model<ChatbotSettingsDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Find-then-create (not upsert) so Mongoose runs full nested-subdocument default construction
   * (e.g. `greetingMessage`/`fallbackMessage`) — `findOneAndUpdate` with `$setOnInsert` skips those defaults.
   */
  async getPolicy(): Promise<ChatbotSettingsDocument> {
    const existing = await this.model.findOne({ _key: 'singleton' });
    return existing ?? this.model.create({ _key: 'singleton' });
  }

  async update(dto: UpdateChatbotSettingsDto, adminId: string): Promise<ChatbotSettingsDocument> {
    await this.getPolicy();

    const update: Record<string, unknown> = { ...dto };
    if (dto.knowledgeSourceIds) {
      update.knowledgeSourceIds = dto.knowledgeSourceIds.map(id => new Types.ObjectId(id));
    }

    const doc = await this.model.findOneAndUpdate(
      { _key: 'singleton' },
      { $set: update },
      { new: true },
    );

    await this.notificationsService.notifyAdmins({
      type: 'settings_updated',
      title: 'Paramètres mis à jour',
      message: 'Les paramètres du chatbot IA ont été modifiés',
      link: '/admin/settings',
      createdBy: adminId,
    });

    return doc;
  }
}
