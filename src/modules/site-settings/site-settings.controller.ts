import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { UpdateSupportSettingsDto } from './dto/update-support-settings.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SiteSettingsController {
  constructor(private readonly svc: SiteSettingsService) {}

  @Public()
  @Get('support')
  getSupport() {
    return this.svc.getSupportSettings();
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch('support')
  updateSupport(@Body() dto: UpdateSupportSettingsDto) {
    return this.svc.updateSupportSettings(dto);
  }
}
