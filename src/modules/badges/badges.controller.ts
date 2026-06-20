import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('badges')
@UseGuards(JwtAuthGuard)
export class BadgesController {
  constructor(private readonly svc: BadgesService) {}

  @Public()
  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: any) {
    return this.svc.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.svc.assign(id, body.userId);
  }

  @Get('user/me')
  myBadges(@CurrentUser('sub') userId: string) {
    return this.svc.getUserBadges(userId);
  }

  @Get('user/:id')
  userBadges(@Param('id') id: string) {
    return this.svc.getUserBadges(id);
  }
}
