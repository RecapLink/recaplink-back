import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  OverviewDto,
  ActivityItemDto,
  ZoneItemDto,
  MonthlyRegistrationItemDto,
  PlasticDistributionItemDto,
} from './dto/dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Global platform KPI overview' })
  @ApiResponse({ status: 200, description: 'Overview statistics', type: OverviewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – admin only' })
  overview() {
    return this.svc.getOverview();
  }

  @Get('plastic-distribution')
  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Plastic type distribution across all offers' })
  @ApiResponse({ status: 200, description: 'Plastic distribution percentages', type: [PlasticDistributionItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  plasticDistribution() {
    return this.svc.getPlasticDistribution();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Recent platform activity feed' })
  @ApiResponse({ status: 200, description: 'Latest activity events', type: [ActivityItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – admin only' })
  activity() {
    return this.svc.getActivityFeed();
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Monthly user registrations for the past 12 months' })
  @ApiResponse({ status: 200, description: 'Monthly registration counts', type: [MonthlyRegistrationItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – admin only' })
  registrations() {
    return this.svc.getRegistrationsByMonth();
  }

  @Get('zones')
  @ApiOperation({ summary: 'Plastic collections aggregated by geographic zone' })
  @ApiResponse({ status: 200, description: 'Collections per zone', type: [ZoneItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – admin only' })
  zones() {
    return this.svc.getCollectionsByZone();
  }
}
