import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('stats')
  overview() {
    return this.svc.getOverview();
  }

  @Get('plastic-distribution')
  @Roles(Role.COLLECTEUR, Role.RECYCLEUR, Role.VENDEUR_PLASTIQUE, Role.ADMIN, Role.SUPER_ADMIN)
  plasticDistribution() {
    return this.svc.getPlasticDistribution();
  }

  @Get('activity')
  activity() {
    return this.svc.getActivityFeed();
  }

  @Get('monthly')
  registrations() {
    return this.svc.getRegistrationsByMonth();
  }

  @Get('zones')
  zones() {
    return this.svc.getCollectionsByZone();
  }
}
