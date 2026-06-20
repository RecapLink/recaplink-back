import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Post()
  create(
    @Body() body: { type: string; targetId: string; reason: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.create(body.type, body.targetId, userId, body.reason);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @Body() body: { status: string; adminNote?: string },
    @CurrentUser('sub') adminId: string,
  ) {
    return this.svc.review(id, adminId, body.status, body.adminNote);
  }
}
