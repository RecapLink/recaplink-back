import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('page') page = 1) {
    return this.svc.findForUser(userId, +page);
  }

  @Get('count')
  count(@CurrentUser('sub') userId: string) {
    return this.svc.countUnread(userId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.svc.markAllRead(userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.svc.markRead(id, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.svc.delete(id, userId);
  }
}
