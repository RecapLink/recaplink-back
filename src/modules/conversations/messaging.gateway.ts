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

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private userSockets = new Map<string, string>();

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
      this.userSockets.set(payload.sub, socket.id);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    if (socket.data.userId) this.userSockets.delete(socket.data.userId);
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
