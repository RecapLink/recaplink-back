import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Knowledge Base')
@Controller('knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(private readonly svc: KnowledgeService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List knowledge content (published only for non-admins)' })
  @ApiResponse({ status: 200, description: 'Paginated knowledge list' })
  findAll(@Query() query: any, @CurrentUser('role') role?: string) {
    return this.svc.findAll({ ...query, admin: role === Role.ADMIN || role === Role.SUPER_ADMIN });
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a knowledge item by slug (increments view count)' })
  @ApiResponse({ status: 200, description: 'Knowledge item' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({ summary: 'Create a knowledge item' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 403, description: 'Forbidden – admin only' })
  create(@Body() dto: CreateKnowledgeDto, @CurrentUser('sub') userId: string) {
    return this.svc.create(dto, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Patch(':slug')
  @ApiOperation({ summary: 'Update a knowledge item' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('slug') slug: string, @Body() dto: Partial<CreateKnowledgeDto>, @CurrentUser('sub') adminId: string) {
    return this.svc.update(slug, dto, adminId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Delete(':slug')
  @ApiOperation({ summary: 'Delete a knowledge item' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('slug') slug: string, @CurrentUser('sub') adminId: string) {
    return this.svc.remove(slug, adminId);
  }

  @Post(':slug/like')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Toggle like on a knowledge item' })
  like(@Param('slug') slug: string, @CurrentUser('sub') userId: string) {
    return this.svc.toggleLike(slug, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Patch(':slug/publish')
  @ApiOperation({ summary: 'Publish a knowledge item' })
  @ApiResponse({ status: 200, description: 'Published' })
  @ApiResponse({ status: 404, description: 'Not found' })
  publish(@Param('slug') slug: string, @CurrentUser('sub') adminId: string) {
    return this.svc.publish(slug, adminId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Patch(':slug/archive')
  @ApiOperation({ summary: 'Archive a knowledge item' })
  @ApiResponse({ status: 200, description: 'Archived' })
  @ApiResponse({ status: 404, description: 'Not found' })
  archive(@Param('slug') slug: string, @CurrentUser('sub') adminId: string) {
    return this.svc.archive(slug, adminId);
  }
}
