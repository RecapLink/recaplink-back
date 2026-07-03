import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserDocument } from './schemas/user.schema';
import { UserStatus } from '../../common/enums/user-status.enum';
import { Role } from '../../common/enums/role.enum';
import { paginate, getPaginationParams } from '../../common/utils/paginate.util';
import { Paginated } from '../../common/types/pagination.type';
import { Types } from 'mongoose';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('email already exists');

    const existingUsername = await this.usersRepo.findByUsername(dto.username);
    if (existingUsername) throw new ConflictException('username already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.usersRepo.create({ ...dto, password: passwordHash });
  }

  async findAll(query: UserQueryDto): Promise<Paginated<UserDocument>> {
    const { skip, limit, page } = getPaginationParams(query.page, query.limit);

    const filter: Record<string, unknown> = {};
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
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
    const user = await this.usersRepo.updateById(id, { $set: dto });
    if (!user) throw new NotFoundException('User not found');

    await this.notificationsService.notifyAdmins({
      type: 'user_updated',
      title: 'Compte mis à jour',
      message: `Le compte de ${user.fullName} a été modifié`,
      link: '/admin/collectors',
      createdBy: requesterId,
      metadata: { userId: id },
    });

    return user;
  }

  async updateStatus(id: string, status: UserStatus, adminId: string): Promise<UserDocument> {
    const previous = await this.usersRepo.findById(id);
    if (!previous) throw new NotFoundException('User not found');

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
        link: '/admin/collectors',
        createdBy: adminId,
        metadata: { userId: id },
      });
    }

    return user;
  }

  async updateRefreshToken(
    id: string | Types.ObjectId,
    token: string | null,
  ): Promise<void> {
    const hash = token ? await bcrypt.hash(token, 10) : null;
    await this.usersRepo.updateById(id, { $set: { refreshTokenHash: hash } });
  }

  async validateRefreshToken(
    userId: string,
    token: string,
  ): Promise<UserDocument> {
    const user = await this.usersRepo.findById(userId);
    if (!user?.refreshTokenHash)
      throw new ForbiddenException('Access denied');

    const isValid = await bcrypt.compare(token, user.refreshTokenHash);
    if (!isValid) throw new ForbiddenException('Access denied');

    return user;
  }

  async remove(id: string, adminId: string): Promise<void> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepo.deleteById(id);

    await this.notificationsService.notifyAdmins({
      type: 'user_deleted',
      title: 'Compte supprimé',
      message: `Le compte de ${user.fullName} a été supprimé`,
      createdBy: adminId,
      metadata: { userId: id },
    });
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
    await this.usersRepo.updateById(id, {
      $set: { password: hash },
      $unset: { refreshTokenHash: '' },
    });
  }
}
