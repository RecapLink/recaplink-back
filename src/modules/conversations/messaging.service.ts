import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Conversation.name) private readonly convModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly msgModel: Model<MessageDocument>,
  ) {}

  async getOrCreateConversation(
    userId: string,
    recipientId: string,
    offerId?: string,
  ): Promise<ConversationDocument> {
    const uid = new Types.ObjectId(userId);
    const rid = new Types.ObjectId(recipientId);

    const existing = await this.convModel.findOne({ participants: { $all: [uid, rid] } });
    if (existing) return existing;

    return this.convModel.create({
      participants: [uid, rid],
      offer: offerId ? new Types.ObjectId(offerId) : undefined,
      lastActivityAt: new Date(),
    });
  }

  async getConversations(userId: string) {
    return this.convModel
      .find({ participants: new Types.ObjectId(userId) })
      .populate('participants', 'fullName username avatarUrl')
      .populate('lastMessage')
      .sort({ lastActivityAt: -1 })
      .lean();
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 30) {
    const conv = await this.convModel.findById(new Types.ObjectId(conversationId));
    if (!conv) throw new NotFoundException('Conversation not found');
    const isParticipant = conv.participants.some((p) => p.toString() === userId);
    if (!isParticipant) throw new ForbiddenException();

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.msgModel
        .find({ conversation: new Types.ObjectId(conversationId) })
        .populate('sender', 'fullName username avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.msgModel.countDocuments({ conversation: new Types.ObjectId(conversationId) }),
    ]);
    return { data: data.reverse(), total, page, limit };
  }

  async createMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type = 'text',
    fileUrl?: string,
  ): Promise<MessageDocument> {
    const msg = await this.msgModel.create({
      conversation: new Types.ObjectId(conversationId),
      sender: new Types.ObjectId(senderId),
      content,
      type,
      fileUrl,
      readBy: [new Types.ObjectId(senderId)],
    });
    await this.convModel.findByIdAndUpdate(conversationId, {
      lastMessage: msg._id,
      lastActivityAt: new Date(),
    });
    return msg.populate('sender', 'fullName username avatarUrl');
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    await this.msgModel.updateMany(
      {
        conversation: new Types.ObjectId(conversationId),
        readBy: { $ne: new Types.ObjectId(userId) },
      },
      { $addToSet: { readBy: new Types.ObjectId(userId) } },
    );
  }
}
