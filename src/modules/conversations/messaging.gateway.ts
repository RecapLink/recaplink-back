import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';

/** Maps a user role to the Socket.IO room used for role-wide broadcasts. */
const ROOM_BY_ROLE: Record<string, string> = {
  user: 'users',
  admin: 'super-admins',
  super_admin: 'super-admins',
};

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        socket.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token, { secret: this.config.get('jwt.secret') });
      socket.data.userId = payload.sub;
      socket.join(`user:${payload.sub}`);
      const room = ROOM_BY_ROLE[payload.role];
      if (room) socket.join(room);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect() {
    // Socket.IO automatically removes a disconnected socket from all its rooms.
  }

  /** Push an event to every socket a user currently has open (multi-tab/device safe). */
  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /** Broadcast to a room (or set of rooms), optionally excluding one user (e.g. the actor). */
  emitToRoom(room: string | string[], event: string, payload: unknown, exceptUserId?: string): void {
    const target = exceptUserId ? this.server.to(room).except(`user:${exceptUserId}`) : this.server.to(room);
    target.emit(event, payload);
  }

  /** Broadcast to every room mapped to the given roles, optionally excluding one user. */
  emitToRoles(roles: string[], event: string, payload: unknown, exceptUserId?: string): void {
    const rooms = [...new Set(roles.map(r => ROOM_BY_ROLE[r]).filter(Boolean))];
    if (!rooms.length) return;
    this.emitToRoom(rooms, event, payload, exceptUserId);
  }

  @SubscribeMessage('join_conversation')
  handleJoin(@MessageBody() data: { conversationId: string }, @ConnectedSocket() socket: Socket) {
    socket.join(`conv:${data.conversationId}`);
  }

  @SubscribeMessage('leave_conversation')
  handleLeave(@MessageBody() data: { conversationId: string }, @ConnectedSocket() socket: Socket) {
    socket.leave(`conv:${data.conversationId}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: { conversationId: string; content: string; type?: string; fileUrl?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;
    if (!userId) return;
    const msg = await this.messagingService.createMessage(
      data.conversationId,
      userId,
      data.content,
      data.type || 'text',
      data.fileUrl,
    );
    this.server.to(`conv:${data.conversationId}`).emit('new_message', msg);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    socket
      .to(`conv:${data.conversationId}`)
      .emit('user_typing', { userId: socket.data.userId, conversationId: data.conversationId });
  }

  @SubscribeMessage('read')
  async handleRead(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;
    if (!userId) return;
    await this.messagingService.markRead(data.conversationId, userId);
    socket
      .to(`conv:${data.conversationId}`)
      .emit('message_read', { conversationId: data.conversationId, userId });
  }
}
