import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotSettingsService } from './chatbot-settings.service';
import { ChatbotService } from './chatbot.service';
import { UpdateChatbotSettingsDto } from './dto/update-chatbot-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Settings')
@ApiBearerAuth('access-token')
@Controller('settings/chatbot')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class ChatbotSettingsController {
  constructor(
    private readonly settingsService: ChatbotSettingsService,
    private readonly chatbotService: ChatbotService,
  ) {}

  @ApiOperation({ summary: 'Get global AI chatbot configuration (used by the mobile app chatbot)' })
  @ApiResponse({ status: 200, description: 'Chatbot settings' })
  @Get()
  get() {
    return this.settingsService.getPolicy();
  }

  @ApiOperation({ summary: 'Update global AI chatbot configuration' })
  @ApiResponse({ status: 200, description: 'Chatbot settings updated' })
  @Patch()
  update(@Body() dto: UpdateChatbotSettingsDto, @CurrentUser('sub') adminId: string) {
    return this.settingsService.update(dto, adminId);
  }

  @ApiOperation({ summary: 'Chatbot usage analytics (session count, escalation rate, avg. messages) — gated by analyticsEnabled' })
  @ApiResponse({ status: 200, description: 'Chatbot analytics' })
  @Get('analytics')
  analytics() {
    return this.chatbotService.getAnalytics();
  }
}
