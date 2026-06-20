import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('overview')
  overview() {
    return this.svc.getOverview();
  }

  @Get('registrations-by-month')
  registrations() {
    return this.svc.getRegistrationsByMonth();
  }

  @Get('collections-by-zone')
  zones() {
    return this.svc.getCollectionsByZone();
  }
}
