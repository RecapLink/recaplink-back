import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Sessions')
@ApiBearerAuth('access-token')
@Controller('auth/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly svc: SessionsService) {}

  @ApiOperation({ summary: "List the current user's devices/sessions (connected devices + login history)" })
  @ApiResponse({ status: 200, description: 'Sessions, newest activity first' })
  @Get()
  async list(@CurrentUser('sub') userId: string, @CurrentUser('sid') currentSessionId: string) {
    const sessions = await this.svc.listForUser(userId);
    return sessions.map(s => ({
      id: s._id.toString(),
      deviceLabel: s.deviceLabel,
      ip: s.ip,
      isTrusted: s.isTrusted,
      isCurrent: s._id.toString() === currentSessionId,
      isRevoked: !!s.revokedAt,
      isExpired: s.expiresAt.getTime() < Date.now(),
      lastActiveAt: s.lastActiveAt,
      createdAt: (s as any).createdAt,
      revokedAt: s.revokedAt,
    }));
  }

  @ApiOperation({ summary: 'Revoke a specific session/device (logs it out)' })
  @ApiParam({ name: 'id', description: 'Session _id' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  @Delete(':id')
  async revoke(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.svc.revoke(id, userId);
    return { message: 'Session révoquée' };
  }

  @ApiOperation({ summary: 'Revoke every other session — "log out of all other devices"' })
  @ApiResponse({ status: 200, description: 'All other sessions revoked' })
  @Delete()
  async revokeOthers(@CurrentUser('sub') userId: string, @CurrentUser('sid') currentSessionId: string) {
    await this.svc.revokeAllExcept(userId, currentSessionId);
    return { message: 'Autres sessions révoquées' };
  }
}
