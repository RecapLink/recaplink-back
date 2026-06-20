import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly svc: MessagingService) {}

  @Get()
  getAll(@CurrentUser('sub') userId: string) {
    return this.svc.getConversations(userId);
  }

  @Post()
  create(
    @Body() body: { recipientId: string; offerId?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.getOrCreateConversation(userId, body.recipientId, body.offerId);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Query('page') page = 1,
  ) {
    return this.svc.getMessages(id, userId, +page);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.svc.markRead(id, userId);
  }
}
