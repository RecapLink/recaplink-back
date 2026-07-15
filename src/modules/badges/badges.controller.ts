import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { BadgeEngineService } from './badge-engine.service';
import { BadgeEngineSettingsService } from './badge-engine-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('badges')
@UseGuards(JwtAuthGuard)
export class BadgesController {
  constructor(
    private readonly svc: BadgesService,
    private readonly engine: BadgeEngineService,
    private readonly engineSettings: BadgeEngineSettingsService,
  ) {}

  @Public()
  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@Body() dto: any, @CurrentUser('sub') adminId: string) {
    return this.svc.create(dto, adminId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser('sub') adminId: string) {
    return this.svc.update(id, dto, adminId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.svc.remove(id, adminId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/assign')
  async assign(@Param('id') id: string, @Body() body: { userId: string }, @CurrentUser('sub') adminId: string) {
    const badge = await this.svc.findOne(id);
    const engineSettings = await this.engineSettings.getPolicy();

    if (badge.autoAssign && !engineSettings.manualOverrideAllowed) {
      const qualifies = await this.engine.userQualifies(badge, body.userId);
      if (!qualifies) {
        throw new ForbiddenException(
          "Ce badge est auto-attribué et la surcharge manuelle est désactivée : l'utilisateur ne remplit pas encore les critères.",
        );
      }
    }

    return this.svc.assign(id, body.userId, adminId);
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
