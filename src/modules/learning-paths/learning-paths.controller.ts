import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LearningPathsService } from './learning-paths.service';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Learning Paths')
@Controller('learning-paths')
@UseGuards(JwtAuthGuard)
export class LearningPathsController {
  constructor(private readonly svc: LearningPathsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List learning paths (published only for non-admins)' })
  findAll(@CurrentUser('role') role?: string) {
    return this.svc.findAll(role === Role.ADMIN || role === Role.SUPER_ADMIN);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a learning path by slug, with completion % if authenticated' })
  findOne(@Param('slug') slug: string, @CurrentUser('sub') userId?: string) {
    return this.svc.findBySlug(slug, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({ summary: 'Create a learning path' })
  create(@Body() dto: CreateLearningPathDto, @CurrentUser('sub') adminId: string) {
    return this.svc.create(dto, adminId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a learning path' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateLearningPathDto>, @CurrentUser('sub') adminId: string) {
    return this.svc.update(id, dto, adminId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a learning path' })
  remove(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.svc.remove(id, adminId);
  }
}
