import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ReportResponseDto, ReportListResponseDto } from './dto/report-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @ApiOperation({ summary: 'Report an offer' })
  @ApiResponse({ status: 201, description: 'Report created', type: ReportResponseDto })
  @Post()
  create(@Body() dto: CreateReportDto, @CurrentUser('sub') userId: string) {
    return this.svc.create(dto, userId);
  }

  @ApiOperation({ summary: 'List reports (admin)' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiQuery({ name: 'offerId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of reports', type: ReportListResponseDto })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  findAll(@Query() query: { status?: string; offerId?: string; page?: number; limit?: number }) {
    return this.svc.findAll(query);
  }

  @ApiOperation({ summary: 'Get a single report by id (admin)' })
  @ApiParam({ name: 'id', description: 'Report _id' })
  @ApiResponse({ status: 200, description: 'Report detail', type: ReportResponseDto })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @ApiOperation({ summary: 'Approve or reject a report (admin)' })
  @ApiParam({ name: 'id', description: 'Report _id' })
  @ApiResponse({ status: 200, description: 'Report reviewed', type: ReportResponseDto })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewReportDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.svc.review(id, adminId, dto);
  }
}
