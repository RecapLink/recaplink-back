import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { UserDocument } from '../users/schemas/user.schema';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../../common/enums/role.enum';
import { SessionsService } from '../sessions/sessions.service';
import { SecuritySettingsService } from '../settings/security-settings.service';
import { SecuritySettings } from '../settings/schemas/security-settings.schema';
import { addDuration } from '../../common/utils/duration.util';

const RESET_TOKEN_EXPIRES_MINUTES = 30;

export interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly sessionsService: SessionsService,
    private readonly securitySettingsService: SecuritySettingsService,
  ) {}

  async register(dto: RegisterDto) {
    const security = await this.securitySettingsService.getPolicy();
    this.assertPasswordPolicy(dto.password, security);

    const user = await this.usersService.create({ ...dto, role: Role.USER });

    await this.notificationsService.notifyAdmins({
      type: 'new_user',
      title: 'Nouvelle inscription',
      message: `${user.fullName} attend une approbation`,
      link: '/admin/users',
      prefKey: 'newInscription',
      metadata: { userId: user._id.toString() },
    });

    return { message: 'Registration successful. Awaiting admin approval.' };
  }

  async login(
    dto: LoginDto,
    meta: RequestMeta = {},
  ): Promise<{ accessToken: string; refreshToken: string; user: UserDocument }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.isDeleted) throw new UnauthorizedException('Invalid credentials');

    const security = await this.securitySettingsService.getPolicy();

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(
        `Compte temporairement verrouillé suite à plusieurs échecs de connexion. Réessayez dans ${minutesLeft} min.`,
      );
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      await this.usersService.incrementFailedLogin(
        user._id,
        security.maxLoginAttempts,
        security.lockoutDurationMinutes,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.resetFailedLogin(user._id);

    return this.buildTokens(user, meta, security);
  }

  async refresh(
    userId: string,
    sessionId: string,
    refreshToken: string,
    meta: RequestMeta = {},
  ): Promise<{ accessToken: string; refreshToken: string; user: UserDocument }> {
    const security = await this.securitySettingsService.getPolicy();
    await this.sessionsService.validateAndTouch(sessionId, userId, refreshToken, security.sessionTimeoutMinutes);
    const user = await this.usersService.findById(userId);
    return this.buildTokens(user, meta, security, sessionId);
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) await this.sessionsService.revoke(sessionId, userId);
  }

  async getMe(userId: string): Promise<UserDocument> {
    return this.usersService.findById(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    const passwordMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Mot de passe actuel incorrect');

    const security = await this.securitySettingsService.getPolicy();
    this.assertPasswordPolicy(dto.newPassword, security);

    await this.usersService.updatePassword(user._id, dto.newPassword);
    this.logger.log(`Password changed for user ${user.email}`);

    return { message: 'Mot de passe modifié avec succès' };
  }

  // ── Password Reset Flow ────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const genericResponse = { message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' };

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) return genericResponse; // Prevent email enumeration

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

    await this.usersService.setResetToken(user._id, hashedToken, expires);

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    try {
      await this.emailService.sendResetPasswordEmail({
        to: user.email,
        fullName: user.fullName,
        resetUrl,
        expiresInMinutes: RESET_TOKEN_EXPIRES_MINUTES,
      });
    } catch (err) {
      this.logger.error(`Failed to send reset email: ${(err as Error).message}`);
      // Clear token so user can retry; return generic message for security
      await this.usersService.clearResetToken(user._id);
    }

    return genericResponse;
  }

  async resendResetEmail(email: string): Promise<{ message: string }> {
    const genericResponse = { message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' };

    const user = await this.usersService.findByEmail(email);
    if (!user) return genericResponse;

    // Regenerate token and resend
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

    await this.usersService.setResetToken(user._id, hashedToken, expires);

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    try {
      await this.emailService.sendResetPasswordEmail({
        to: user.email,
        fullName: user.fullName,
        resetUrl,
        expiresInMinutes: RESET_TOKEN_EXPIRES_MINUTES,
      });
    } catch (err) {
      this.logger.error(`Failed to resend reset email: ${(err as Error).message}`);
      await this.usersService.clearResetToken(user._id);
    }

    return genericResponse;
  }

  async validateResetToken(rawToken: string): Promise<{ valid: boolean }> {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await this.usersService.findByResetToken(hashedToken);
    return { valid: !!user };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');
    const user = await this.usersService.findByResetToken(hashedToken);

    if (!user) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré.');
    }

    const security = await this.securitySettingsService.getPolicy();
    this.assertPasswordPolicy(dto.password, security);

    await this.usersService.updatePassword(user._id, dto.password);
    await this.usersService.clearResetToken(user._id);

    this.logger.log(`Password reset for user ${user.email}`);

    return { message: 'Mot de passe réinitialisé avec succès.' };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private assertPasswordPolicy(password: string, security: SecuritySettings): void {
    const errors = this.securitySettingsService.validatePassword(password, security.passwordPolicy);
    if (errors.length) throw new BadRequestException(errors.join(' '));
  }

  private async buildTokens(
    user: UserDocument,
    meta: RequestMeta,
    security: SecuritySettings,
    existingSessionId?: string,
  ) {
    const jwtExpiresIn = security.jwtExpiresIn || (this.config.get('jwt.expiresIn') as string);
    const refreshExpiresIn = security.refreshTokenExpiresIn || (this.config.get('jwt.refreshExpiresIn') as string);
    const refreshExpiresAt = addDuration(new Date(), refreshExpiresIn);

    const sessionObjectId = existingSessionId ? new Types.ObjectId(existingSessionId) : new Types.ObjectId();

    const payload: JwtPayload = {
      sub: user._id.toString(),
      role: user.role,
      status: user.status,
      sid: sessionObjectId.toString(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as object, {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: jwtExpiresIn,
      } as object),
      this.jwtService.signAsync(
        { sub: user._id.toString(), sid: sessionObjectId.toString() } as object,
        {
          secret: this.config.get<string>('jwt.refreshSecret'),
          expiresIn: refreshExpiresIn,
        } as object,
      ),
    ]);

    if (existingSessionId) {
      await this.sessionsService.rotateToken(sessionObjectId, refreshToken, refreshExpiresAt);
    } else {
      await this.sessionsService.create({
        sessionId: sessionObjectId,
        userId: user._id,
        refreshToken,
        userAgent: meta.userAgent,
        ip: meta.ip,
        expiresAt: refreshExpiresAt,
      });
    }

    return { accessToken, refreshToken, user };
  }
}
