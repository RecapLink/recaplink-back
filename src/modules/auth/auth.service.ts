import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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
