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

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

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
    if (requesterId !== id && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException('Cannot update another user');
    }
    const user = await this.usersRepo.updateById(id, { $set: dto });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserDocument> {
    const user = await this.usersRepo.updateById(id, { $set: { status } });
    if (!user) throw new NotFoundException('User not found');
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

  async remove(id: string): Promise<void> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepo.deleteById(id);
  }
}
