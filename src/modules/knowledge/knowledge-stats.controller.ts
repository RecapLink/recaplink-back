import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

// NOTE: this controller must be registered BEFORE KnowledgeController in
// knowledge.module.ts's `controllers` array — KnowledgeController has a public
// `GET :slug` wildcard route that would otherwise swallow `/knowledge/statistics`.
@ApiTags('Knowledge Base')
@ApiBearerAuth('access-token')
@Controller('knowledge/statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class KnowledgeStatsController {
  constructor(private readonly svc: KnowledgeService) {}

  @Get()
  @ApiOperation({ summary: 'Knowledge base KPI overview (counts, views trend, top content/categories)' })
  getStatistics() {
    return this.svc.getStatistics();
  }
}
