import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BadgeEngineSettingsService } from './badge-engine-settings.service';
import { BadgeEngineService } from './badge-engine.service';
import { UpdateBadgeEngineSettingsDto } from './dto/update-badge-engine-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Settings')
@ApiBearerAuth('access-token')
@Controller('settings/badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class BadgeEngineController {
  constructor(
    private readonly settingsService: BadgeEngineSettingsService,
    private readonly engine: BadgeEngineService,
  ) {}

  @ApiOperation({ summary: 'Get the automatic badge engine configuration' })
  @ApiResponse({ status: 200, description: 'Badge engine settings' })
  @Get()
  get() {
    return this.settingsService.getPolicy();
  }

  @ApiOperation({ summary: 'Update the automatic badge engine configuration' })
  @ApiResponse({ status: 200, description: 'Badge engine settings updated' })
  @Patch()
  update(@Body() dto: UpdateBadgeEngineSettingsDto, @CurrentUser('sub') adminId: string) {
    return this.settingsService.update(dto, adminId);
  }

  @ApiOperation({ summary: 'Run the automatic badge recalculation immediately (manual trigger)' })
  @ApiResponse({ status: 200, description: 'Recalculation result: users scanned and badges awarded' })
  @Post('recalculate')
  recalculate() {
    return this.engine.recalculate();
  }
}
