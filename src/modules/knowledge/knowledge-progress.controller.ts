import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KnowledgeProgressService } from './knowledge-progress.service';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Knowledge Progress')
@ApiBearerAuth('access-token')
@Controller('knowledge/progress')
@UseGuards(JwtAuthGuard)
export class KnowledgeProgressController {
  constructor(private readonly svc: KnowledgeProgressService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's knowledge progress" })
  getMine(@CurrentUser('sub') userId: string) {
    return this.svc.getForUser(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: "Get the current user's knowledge learning stats" })
  getStats(@CurrentUser('sub') userId: string) {
    return this.svc.getUserStats(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Create or update progress on a knowledge item' })
  upsert(@Body() dto: UpsertProgressDto, @CurrentUser('sub') userId: string) {
    return this.svc.upsert(userId, dto);
  }
}
