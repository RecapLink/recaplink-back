import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SupportTicket, SupportTicketDocument } from './schemas/support-ticket.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { TicketStatus } from './enums';
import { Role } from '../../common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';

const AUTHOR_SUMMARY_FIELDS = 'fullName username avatarUrl role';

export interface Requester {
  id: string;
  role: Role;
}

@Injectable()
export class SupportTicketsService {
  constructor(
    @InjectModel(SupportTicket.name) private readonly model: Model<SupportTicketDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateTicketDto, requester: Requester): Promise<SupportTicketDocument> {
    const ticket = await this.model.create({
      createdBy: new Types.ObjectId(requester.id),
      title: dto.title,
      category: dto.category,
      priority: dto.priority,
      description: dto.description,
      screenshotUrl: dto.screenshotUrl,
    });

    await this.notificationsService.notifyRoles({
      roles: [Role.SUPER_ADMIN],
      type: 'ticket_created',
      title: 'Nouveau rapport',
      message: `${dto.title}`,
      link: '/admin/settings',
      excludeUserId: requester.id,
      metadata: { ticketId: ticket._id.toString() },
    });

    return this.populate(ticket);
  }

  async findAll(requester: Requester, query: { status?: TicketStatus; category?: string; priority?: string; page?: number; limit?: number }) {
    const filter: Record<string, unknown> = {};
    if (requester.role !== Role.SUPER_ADMIN) filter.createdBy = new Types.ObjectId(requester.id);
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    if (query.priority) filter.priority = query.priority;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('createdBy', AUTHOR_SUMMARY_FIELDS)
        .select('-messages')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, requester: Requester): Promise<SupportTicketDocument> {
    const ticket = await this.model
      .findById(new Types.ObjectId(id))
      .populate('createdBy', AUTHOR_SUMMARY_FIELDS)
      .populate('messages.author', AUTHOR_SUMMARY_FIELDS);
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertAccess(ticket, requester);
    return ticket;
  }

  async addMessage(id: string, dto: AddTicketMessageDto, requester: Requester): Promise<SupportTicketDocument> {
    const ticket = await this.model.findById(new Types.ObjectId(id));
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertAccess(ticket, requester);

    ticket.messages.push({
      author: new Types.ObjectId(requester.id),
      authorRole: requester.role,
      body: dto.body,
      attachmentUrl: dto.attachmentUrl,
      createdAt: new Date(),
    });

    const isOwner = ticket.createdBy.toString() === requester.id;
    if (isOwner && ticket.status === TicketStatus.WAITING_FOR_USER) {
      ticket.status = TicketStatus.IN_PROGRESS;
    } else if (!isOwner && ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    await ticket.save();

    if (isOwner) {
      await this.notificationsService.notifyRoles({
        roles: [Role.SUPER_ADMIN],
        type: 'ticket_message',
        title: 'Nouveau message sur un rapport',
        message: `${ticket.title}: ${dto.body.slice(0, 80)}`,
        link: '/admin/settings',
        excludeUserId: requester.id,
        metadata: { ticketId: ticket._id.toString() },
      });
    } else {
      await this.notificationsService.create({
        recipientId: ticket.createdBy.toString(),
        type: 'ticket_message',
        title: 'Réponse du support technique',
        message: `${ticket.title}: ${dto.body.slice(0, 80)}`,
        link: '/admin/settings',
        createdBy: requester.id,
        metadata: { ticketId: ticket._id.toString() },
      });
    }

    return this.populate(ticket);
  }

  async updateStatus(id: string, dto: UpdateTicketStatusDto, adminId: string): Promise<SupportTicketDocument> {
    const ticket = await this.model.findById(new Types.ObjectId(id));
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = dto.status;
    await ticket.save();

    await this.notificationsService.create({
      recipientId: ticket.createdBy.toString(),
      type: 'ticket_status_changed',
      title: 'Statut de votre rapport mis à jour',
      message: `${ticket.title} est maintenant "${dto.status}"`,
      link: '/admin/settings',
      createdBy: adminId,
      metadata: { ticketId: ticket._id.toString(), status: dto.status },
    });

    return this.populate(ticket);
  }

  private assertAccess(ticket: SupportTicketDocument, requester: Requester): void {
    if (requester.role === Role.SUPER_ADMIN) return;
    if (ticket.createdBy.toString() !== requester.id) {
      throw new ForbiddenException('Vous ne pouvez consulter que vos propres rapports');
    }
  }

  private async populate(ticket: SupportTicketDocument): Promise<SupportTicketDocument> {
    return ticket.populate([
      { path: 'createdBy', select: AUTHOR_SUMMARY_FIELDS },
      { path: 'messages.author', select: AUTHOR_SUMMARY_FIELDS },
    ]);
  }
}
