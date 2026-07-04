import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KnowledgeCategoryService } from './knowledge-category.service';
import { CreateKnowledgeCategoryDto, UpdateKnowledgeCategoryDto } from './dto/create-knowledge-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

// NOTE: this controller must be registered BEFORE KnowledgeController in
// knowledge.module.ts's `controllers` array — KnowledgeController has a public
// `GET :slug` wildcard route that would otherwise swallow `/knowledge/categories`.
@ApiTags('Knowledge Base')
@Controller('knowledge/categories')
export class KnowledgeCategoryController {
  constructor(private readonly svc: KnowledgeCategoryService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all knowledge categories' })
  findAll() {
    return this.svc.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({ summary: 'Create a knowledge category' })
  create(@Body() dto: CreateKnowledgeCategoryDto) {
    return this.svc.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a knowledge category' })
  update(@Param('id') id: string, @Body() dto: UpdateKnowledgeCategoryDto) {
    return this.svc.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a knowledge category' })
  async remove(@Param('id') id: string) {
    await this.svc.remove(id);
    return { message: 'Category deleted' };
  }
}
