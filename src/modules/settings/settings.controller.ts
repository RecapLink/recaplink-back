import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LocalizationSettingsService } from './localization-settings.service';
import { SecuritySettingsService } from './security-settings.service';
import { SessionsService } from '../sessions/sessions.service';
import { UpdateLocalizationSettingsDto } from './dto/update-localization-settings.dto';
import { UpdateSecuritySettingsDto } from './dto/update-security-settings.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Settings')
@ApiBearerAuth('access-token')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(
    private readonly localization: LocalizationSettingsService,
    private readonly security: SecuritySettingsService,
    private readonly sessions: SessionsService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Get global localization settings (public — used to bootstrap i18n)' })
  @ApiResponse({ status: 200, description: 'Localization settings' })
  @Get('localization')
  getLocalization() {
    return this.localization.get();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update global localization settings' })
  @ApiResponse({ status: 200, description: 'Localization settings updated' })
  @Patch('localization')
  updateLocalization(@Body() dto: UpdateLocalizationSettingsDto, @CurrentUser('sub') adminId: string) {
    return this.localization.update(dto, adminId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get global security settings (JWT/session/lockout/password policy/upload limits)' })
  @ApiResponse({ status: 200, description: 'Security settings' })
  @Get('security')
  getSecurity() {
    return this.security.getPolicy();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update global security settings' })
  @ApiResponse({ status: 200, description: 'Security settings updated' })
  @Patch('security')
  updateSecurity(@Body() dto: UpdateSecuritySettingsDto, @CurrentUser('sub') adminId: string) {
    return this.security.update(dto, adminId);
  }

  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: "List a user's active sessions/devices (global device-management view)" })
  @ApiQuery({ name: 'userId', required: true })
  @ApiResponse({ status: 200, description: 'Active sessions for the given user' })
  @Get('security/sessions')
  async getUserSessions(@Query('userId') userId: string) {
    const list = await this.sessions.listActiveForUser(userId);
    return list.map(s => ({
      id: s._id.toString(),
      deviceLabel: s.deviceLabel,
      ip: s.ip,
      isTrusted: s.isTrusted,
      lastActiveAt: s.lastActiveAt,
      createdAt: (s as any).createdAt,
    }));
  }
}
