import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationListResponseDto } from './dto/notification-response.dto';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @ApiOperation({ summary: 'List the current user\'s notifications, newest first' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of notifications', type: NotificationListResponseDto })
  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('page') page = 1) {
    return this.svc.findForUser(userId, +page);
  }

  @ApiOperation({ summary: 'Count the current user\'s unread notifications' })
  @ApiResponse({ status: 200, description: 'Unread notification count', schema: { type: 'number' } })
  @Get('unread-count')
  unreadCount(@CurrentUser('sub') userId: string) {
    return this.svc.countUnread(userId);
  }

  @ApiOperation({ summary: 'Mark all of the current user\'s notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @Patch('read-all')
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.svc.markAllRead(userId);
  }

  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', description: 'Notification _id' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.svc.markRead(id, userId);
  }

  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification _id' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.svc.delete(id, userId);
  }
}
