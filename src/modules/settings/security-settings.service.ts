import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SecuritySettings, SecuritySettingsDocument } from './schemas/security-settings.schema';
import { UpdateSecuritySettingsDto } from './dto/update-security-settings.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SecuritySettingsService {
  constructor(
    @InjectModel(SecuritySettings.name)
    private readonly model: Model<SecuritySettingsDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Read-only accessor used at runtime by auth/files — always resolves the singleton, creating it on first use.
   * Uses find-then-create (not findOneAndUpdate upsert) because Mongoose only applies nested-subdocument
   * defaults (e.g. passwordPolicy) through the full document-construction path that `.create()` runs.
   */
  async getPolicy(): Promise<SecuritySettingsDocument> {
    const existing = await this.model.findOne({ _key: 'singleton' });
    return existing ?? this.model.create({ _key: 'singleton' });
  }

  async update(dto: UpdateSecuritySettingsDto, adminId: string): Promise<SecuritySettingsDocument> {
    await this.getPolicy(); // ensure the singleton exists with full defaults before patching it

    const update: Record<string, unknown> = { ...dto };
    if (dto.passwordPolicy) {
      update.passwordPolicy = dto.passwordPolicy;
    }

    const doc = await this.model.findOneAndUpdate(
      { _key: 'singleton' },
      { $set: update },
      { new: true },
    );

    await this.notificationsService.notifyAdmins({
      type: 'settings_updated',
      title: 'Paramètres mis à jour',
      message: 'Les paramètres de sécurité ont été modifiés',
      link: '/admin/settings',
      createdBy: adminId,
    });

    return doc;
  }

  /** Throws-free validator: returns a list of human-readable violations, empty if the password satisfies the policy. */
  validatePassword(password: string, policy: SecuritySettings['passwordPolicy']): string[] {
    const errors: string[] = [];
    if (password.length < policy.minLength) {
      errors.push(`Le mot de passe doit contenir au moins ${policy.minLength} caractères`);
    }
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }
    if (policy.requireNumber && !/[0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    if (policy.requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }
    return errors;
  }
}
