import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(private readonly svc: KnowledgeService) {}

  @Public()
  @Get()
  findAll(@Query() query: any, @CurrentUser('role') role?: string) {
    return this.svc.findAll({ ...query, admin: role === Role.ADMIN });
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateKnowledgeDto, @CurrentUser('sub') userId: string) {
    return this.svc.create(dto, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: Partial<CreateKnowledgeDto>) {
    return this.svc.update(slug, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':slug')
  remove(@Param('slug') slug: string) {
    return this.svc.remove(slug);
  }

  @Post(':slug/like')
  like(@Param('slug') slug: string, @CurrentUser('sub') userId: string) {
    return this.svc.toggleLike(slug, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':slug/publish')
  publish(@Param('slug') slug: string) {
    return this.svc.publish(slug);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':slug/archive')
  archive(@Param('slug') slug: string) {
    return this.svc.archive(slug);
  }
}
