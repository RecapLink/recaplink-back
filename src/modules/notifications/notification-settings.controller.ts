import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationSettingsService } from './notification-settings.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Settings')
@ApiBearerAuth('access-token')
@Controller('settings/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class NotificationSettingsController {
  constructor(private readonly svc: NotificationSettingsService) {}

  @ApiOperation({ summary: 'Get global notification settings (channels, categories, retention, real-time, templates)' })
  @ApiResponse({ status: 200, description: 'Notification settings' })
  @Get()
  get() {
    return this.svc.getPolicy();
  }

  @ApiOperation({ summary: 'Update global notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings updated' })
  @Patch()
  update(@Body() dto: UpdateNotificationSettingsDto) {
    return this.svc.update(dto);
  }
}
