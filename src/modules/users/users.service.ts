import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserDocument } from './schemas/user.schema';
import { UserStatus } from '../../common/enums/user-status.enum';
import { Role } from '../../common/enums/role.enum';
import { paginate, getPaginationParams } from '../../common/utils/paginate.util';
import { Paginated } from '../../common/types/pagination.type';
import { Types } from 'mongoose';
import { NotificationsService } from '../notifications/notifications.service';
import { SessionsService } from '../sessions/sessions.service';
import { UpdateDashboardPrefsDto } from './dto/update-dashboard-prefs.dto';
import { Knowledge, KnowledgeDocument } from '../knowledge/schemas/knowledge.schema';
import { UserBadge, UserBadgeDocument } from '../badges/schemas/user-badge.schema';

export interface AdminProfileStats {
  usersManaged: number;
  entriesCreated: number;
  badgesAwarded: number;
  activeDays: number;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly notificationsService: NotificationsService,
    private readonly sessionsService: SessionsService,
    @InjectModel(Knowledge.name) private readonly knowledgeModel: Model<KnowledgeDocument>,
    @InjectModel(UserBadge.name) private readonly userBadgeModel: Model<UserBadgeDocument>,
  ) {}

  async create(dto: CreateUserDto, requesterRole?: Role): Promise<UserDocument> {
    if (dto.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('The Super Admin cannot be created via the API');
    }
    if (dto.role === Role.ADMIN && requesterRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only the Super Admin can create Admin accounts');
    }
    if ((dto.role ?? Role.USER) === Role.USER) {
      const canBuy = dto.canBuy ?? true;
      const canSell = dto.canSell ?? true;
      if (!canBuy && !canSell) {
        throw new BadRequestException('A user must be able to buy, sell, or both');
      }
    }

    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('email already exists');

    const existingUsername = await this.usersRepo.findByUsername(dto.username);
    if (existingUsername) throw new ConflictException('username already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.usersRepo.create({ ...dto, password: passwordHash });
  }

  async findAll(query: UserQueryDto): Promise<Paginated<UserDocument>> {
    const { skip, limit, page } = getPaginationParams(query.page, query.limit);

    const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    if (query.legalStatus) filter.legalStatus = query.legalStatus;
    if (query.verified !== undefined) filter.verified = query.verified;
    if (query.canBuy !== undefined) filter.canBuy = query.canBuy;
    if (query.canSell !== undefined) filter.canSell = query.canSell;
    if (query.zone) filter.zone = query.zone;
    if (query.search) {
      filter.$or = [
        { fullName: { $regex: query.search, $options: 'i' } },
        { username: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await this.usersRepo.findMany(filter, skip, limit);
    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepo.findByEmail(email);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    requesterId: string,
    requesterRole: Role,
  ): Promise<UserDocument> {
    if (requesterId !== id && requesterRole !== Role.ADMIN && requesterRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot update another user');
    }

    const target = await this.usersRepo.findById(id);
    if (!target) throw new NotFoundException('User not found');
    if (target.role === Role.SUPER_ADMIN && dto.email !== undefined && dto.email !== target.email) {
      throw new ForbiddenException('Cannot change the Super Admin email');
    }

    const user = await this.usersRepo.updateById(id, { $set: dto });
    if (!user) throw new NotFoundException('User not found');

    await this.notificationsService.notifyAdmins({
      type: 'user_updated',
      title: 'Compte mis à jour',
      message: `Le compte de ${user.fullName} a été modifié`,
      link: '/admin/users',
      createdBy: requesterId,
      metadata: { userId: id },
    });

    return user;
  }

  async updateStatus(id: string, status: UserStatus, adminId: string): Promise<UserDocument> {
    const previous = await this.usersRepo.findById(id);
    if (!previous) throw new NotFoundException('User not found');
    if (previous.role === Role.SUPER_ADMIN && status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Cannot suspend the Super Admin');
    }

    const user = await this.usersRepo.updateById(id, { $set: { status } });
    if (!user) throw new NotFoundException('User not found');

    let type: string | null = null;
    let title = '';
    if (previous.status === UserStatus.PENDING && status === UserStatus.ACTIVE) {
      type = 'user_verified';
      title = 'Compte vérifié';
    } else if (status === UserStatus.SUSPENDED) {
      type = 'user_suspended';
      title = 'Compte suspendu';
    } else if (previous.status === UserStatus.SUSPENDED && status === UserStatus.ACTIVE) {
      type = 'user_reactivated';
      title = 'Compte réactivé';
    }

    if (type) {
      await this.notificationsService.notifyAdmins({
        type,
        title,
        message: `Le compte de ${user.fullName} est maintenant ${status}`,
        link: '/admin/users',
        createdBy: adminId,
        metadata: { userId: id },
      });
    }

    return user;
  }

  async incrementFailedLogin(id: string | Types.ObjectId, lockAfter: number, lockMinutes: number): Promise<UserDocument | null> {
    const user = await this.usersRepo.updateById(id, { $inc: { failedLoginAttempts: 1 } });
    if (user && user.failedLoginAttempts >= lockAfter) {
      const lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
      return this.usersRepo.updateById(id, { $set: { lockedUntil } });
    }
    return user;
  }

  async resetFailedLogin(id: string | Types.ObjectId): Promise<void> {
    await this.usersRepo.updateById(id, { $set: { failedLoginAttempts: 0, lockedUntil: null } });
  }

  async updateDashboardPrefs(id: string, dto: UpdateDashboardPrefsDto): Promise<UserDocument> {
    const user = await this.usersRepo.updateById(id, { $set: { dashboardPrefs: dto } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Real, backend-computed profile KPIs for the current admin — no mock/random data. */
  async getMyStats(id: string): Promise<AdminProfileStats> {
    const user = await this.findById(id);

    const [usersManaged, entriesCreated, badgesAwarded] = await Promise.all([
      this.notificationsService.countDistinctManagedUsers(id),
      this.knowledgeModel.countDocuments({ author: new Types.ObjectId(id) }),
      this.userBadgeModel.countDocuments({ awardedBy: id }),
    ]);

    const msPerDay = 24 * 60 * 60 * 1000;
    const activeDays = Math.max(1, Math.floor((Date.now() - user.createdAt.getTime()) / msPerDay) + 1);

    return { usersManaged, entriesCreated, badgesAwarded, activeDays };
  }

  /** Recent actions this admin performed, for the profile activity timeline. */
  async getMyActivity(id: string, limit = 20) {
    return this.notificationsService.findRecentByCreator(id, limit);
  }

  async remove(id: string, adminId: string): Promise<void> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot delete the Super Admin');
    }
    await this.usersRepo.updateById(id, { $set: { isDeleted: true, deletedAt: new Date() } });

    await this.notificationsService.notifyAdmins({
      type: 'user_deleted',
      title: 'Compte supprimé',
      message: `Le compte de ${user.fullName} a été supprimé`,
      createdBy: adminId,
      metadata: { userId: id },
    });
  }

  async adminUpdate(id: string, dto: AdminUpdateUserDto, requesterRole: Role): Promise<UserDocument> {
    const target = await this.usersRepo.findById(id);
    if (!target) throw new NotFoundException('User not found');

    if (target.role === Role.SUPER_ADMIN) {
      if (dto.role !== undefined && dto.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Cannot change the Super Admin role');
      }
      if (dto.email !== undefined && dto.email !== target.email) {
        throw new ForbiddenException('Cannot change the Super Admin email');
      }
      if (dto.status !== undefined && dto.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException('Cannot suspend the Super Admin');
      }
    }

    if (dto.role === Role.SUPER_ADMIN && target.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('The Super Admin cannot be assigned via the API');
    }

    const promotingOrDemotingAdmin =
      dto.role !== undefined &&
      dto.role !== target.role &&
      (dto.role === Role.ADMIN || target.role === Role.ADMIN);
    if (promotingOrDemotingAdmin && requesterRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only the Super Admin can promote or demote an Admin');
    }

    const nextRole = dto.role ?? target.role;
    if (nextRole === Role.USER) {
      const canBuy = dto.canBuy ?? target.canBuy;
      const canSell = dto.canSell ?? target.canSell;
      if (!canBuy && !canSell) {
        throw new BadRequestException('A user must be able to buy, sell, or both');
      }
    }

    const user = await this.usersRepo.updateById(id, { $set: dto });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByResetToken(hashedToken: string): Promise<UserDocument | null> {
    return this.usersRepo.findByResetToken(hashedToken);
  }

  async setResetToken(
    id: string | Types.ObjectId,
    hashedToken: string,
    expires: Date,
  ): Promise<void> {
    await this.usersRepo.updateById(id, {
      $set: { passwordResetToken: hashedToken, passwordResetExpires: expires },
    });
  }

  async clearResetToken(id: string | Types.ObjectId): Promise<void> {
    await this.usersRepo.updateById(id, {
      $unset: { passwordResetToken: '', passwordResetExpires: '' },
    });
  }

  async updatePassword(id: string | Types.ObjectId, newPassword: string): Promise<void> {
    const hash = await bcrypt.hash(newPassword, 10);
    await this.usersRepo.updateById(id, { $set: { password: hash } });
    // Force re-login on every device after a password change/reset
    await this.sessionsService.revokeAllExcept(id.toString());
  }
}
