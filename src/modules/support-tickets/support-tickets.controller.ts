import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SupportTicketsService } from './support-tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { TicketStatus } from './enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Support Tickets')
@ApiBearerAuth('access-token')
@Controller('support-tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class SupportTicketsController {
  constructor(private readonly svc: SupportTicketsService) {}

  @ApiOperation({ summary: 'Report a bug, technical issue, missing feature, question, etc. to the Technical Support team' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  @Post()
  create(@Body() dto: CreateTicketDto, @CurrentUser('sub') userId: string, @CurrentUser('role') role: Role) {
    return this.svc.create(dto, { id: userId, role });
  }

  @ApiOperation({ summary: 'List support tickets — Super Admin sees every ticket, Admin sees only their own' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of tickets' })
  @Get()
  findAll(
    @Query() query: { status?: TicketStatus; category?: string; priority?: string; page?: number; limit?: number },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.svc.findAll({ id: userId, role }, query);
  }

  @ApiOperation({ summary: 'Get a ticket, including its full conversation history' })
  @ApiParam({ name: 'id', description: 'Ticket _id' })
  @ApiResponse({ status: 200, description: 'Ticket detail' })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: Role) {
    return this.svc.findOne(id, { id: userId, role });
  }

  @ApiOperation({ summary: 'Reply on a ticket — owner or Technical Support (Super Admin)' })
  @ApiParam({ name: 'id', description: 'Ticket _id' })
  @ApiResponse({ status: 200, description: 'Message added' })
  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @Body() dto: AddTicketMessageDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.svc.addMessage(id, dto, { id: userId, role });
  }

  @ApiOperation({ summary: 'Update ticket status — Technical Support (Super Admin) only' })
  @ApiParam({ name: 'id', description: 'Ticket _id' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @Roles(Role.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto, @CurrentUser('sub') adminId: string) {
    return this.svc.updateStatus(id, dto, adminId);
  }
}
