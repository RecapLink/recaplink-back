import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Session, SessionDocument } from './schemas/session.schema';

interface CreateSessionParams {
  userId: string | Types.ObjectId;
  refreshToken: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  /** Pre-allocated Mongo _id so the JWT `sid` claim can be embedded before the doc is written. */
  sessionId?: Types.ObjectId;
}

/** Small dependency-free UA parser — good enough for a human-readable device label, not full detection. */
function parseDeviceLabel(userAgent = ''): string {
  const ua = userAgent.toLowerCase();
  let os = 'Appareil inconnu';
  if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('linux')) os = 'Linux';

  let browser = 'Navigateur';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';

  return userAgent ? `${browser} · ${os}` : 'Appareil inconnu';
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private readonly model: Model<SessionDocument>,
  ) {}

  async create(params: CreateSessionParams): Promise<SessionDocument> {
    const refreshTokenHash = await bcrypt.hash(params.refreshToken, 10);
    return this.model.create({
      ...(params.sessionId ? { _id: params.sessionId } : {}),
      user: new Types.ObjectId(params.userId),
      refreshTokenHash,
      userAgent: params.userAgent ?? '',
      deviceLabel: parseDeviceLabel(params.userAgent),
      ip: params.ip ?? '',
      lastActiveAt: new Date(),
      expiresAt: params.expiresAt,
    });
  }

  async listForUser(userId: string): Promise<SessionDocument[]> {
    return this.model
      .find({ user: new Types.ObjectId(userId) })
      .sort({ lastActiveAt: -1 })
      .limit(50)
      .exec();
  }

  async listActiveForUser(userId: string | Types.ObjectId): Promise<SessionDocument[]> {
    return this.model
      .find({ user: new Types.ObjectId(userId), revokedAt: null, expiresAt: { $gt: new Date() } })
      .sort({ lastActiveAt: -1 })
      .exec();
  }

  /** Validates a presented refresh token against a session, enforcing revocation, expiry and idle timeout. */
  async validateAndTouch(
    sessionId: string,
    userId: string,
    rawToken: string,
    sessionTimeoutMinutes?: number,
  ): Promise<SessionDocument> {
    const session = await this.model.findOne({
      _id: new Types.ObjectId(sessionId),
      user: new Types.ObjectId(userId),
    });
    if (!session || session.revokedAt) throw new ForbiddenException('Session invalide ou révoquée');
    if (session.expiresAt.getTime() < Date.now()) throw new ForbiddenException('Session expirée');

    if (sessionTimeoutMinutes) {
      const idleMs = Date.now() - session.lastActiveAt.getTime();
      if (idleMs > sessionTimeoutMinutes * 60 * 1000) {
        session.revokedAt = new Date();
        await session.save();
        throw new ForbiddenException('Session expirée par inactivité');
      }
    }

    const isValid = await bcrypt.compare(rawToken, session.refreshTokenHash);
    if (!isValid) throw new ForbiddenException('Session invalide ou révoquée');

    return session;
  }

  async rotateToken(sessionId: string | Types.ObjectId, newRefreshToken: string, newExpiresAt: Date): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await this.model.updateOne(
      { _id: sessionId },
      { $set: { refreshTokenHash, lastActiveAt: new Date(), expiresAt: newExpiresAt } },
    );
  }

  async revoke(sessionId: string | Types.ObjectId, userId?: string): Promise<void> {
    const filter: Record<string, unknown> = { _id: sessionId };
    if (userId) filter.user = new Types.ObjectId(userId);
    await this.model.updateOne(filter, { $set: { revokedAt: new Date() } });
  }

  async revokeAllExcept(userId: string, exceptSessionId?: string): Promise<void> {
    const filter: Record<string, unknown> = { user: new Types.ObjectId(userId), revokedAt: null };
    if (exceptSessionId) filter._id = { $ne: new Types.ObjectId(exceptSessionId) };
    await this.model.updateMany(filter, { $set: { revokedAt: new Date() } });
  }
}
