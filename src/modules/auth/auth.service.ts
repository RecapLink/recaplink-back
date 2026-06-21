import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { UserDocument } from '../users/schemas/user.schema';
import { EmailService } from '../email/email.service';

const RESET_TOKEN_EXPIRES_MINUTES = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return { message: 'Registration successful. Awaiting admin approval.' };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: UserDocument }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    return this.buildTokens(user);
  }

  async refresh(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: UserDocument }> {
    const user = await this.usersService.validateRefreshToken(userId, refreshToken);
    return this.buildTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async getMe(userId: string): Promise<UserDocument> {
    return this.usersService.findById(userId);
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

    await this.usersService.updatePassword(user._id, dto.password);
    await this.usersService.clearResetToken(user._id);

    this.logger.log(`Password reset for user ${user.email}`);

    return { message: 'Mot de passe réinitialisé avec succès.' };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async buildTokens(user: UserDocument) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      role: user.role,
      status: user.status,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as object, {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get('jwt.expiresIn') as string,
      } as object),
      this.jwtService.signAsync(
        { sub: user._id.toString() } as object,
        {
          secret: this.config.get<string>('jwt.refreshSecret'),
          expiresIn: this.config.get('jwt.refreshExpiresIn') as string,
        } as object,
      ),
    ]);

    await this.usersService.updateRefreshToken(user._id, refreshToken);

    return { accessToken, refreshToken, user };
  }
}
