import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateDashboardPrefsDto } from './dto/update-dashboard-prefs.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { Types } from 'mongoose';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto, @CurrentUser('role') requesterRole: Role) {
    return this.usersService.create(dto, requesterRole);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.usersService.findById(id.toString());
  }

  @Patch('me')
  updateMe(
    @Body() dto: UpdateUserDto,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') requesterRole: Role,
  ) {
    return this.usersService.update(requesterId, dto, requesterId, requesterRole);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateUserDto,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') requesterRole: Role,
  ) {
    return this.usersService.update(
      id.toString(),
      dto,
      requesterId,
      requesterRole,
    );
  }

  @Patch('me/dashboard-prefs')
  updateDashboardPrefs(
    @Body() dto: UpdateDashboardPrefsDto,
    @CurrentUser('sub') requesterId: string,
  ) {
    return this.usersService.updateDashboardPrefs(requesterId, dto);
  }

  @ApiOperation({
    summary: 'Real, backend-computed KPIs for the current admin\'s profile page',
    description:
      'usersManaged = distinct users this admin has verified/suspended/reactivated/updated/deleted. ' +
      'entriesCreated = Knowledge articles authored by this admin. badgesAwarded = badges this admin manually assigned. ' +
      'activeDays = days since account creation. No mock data.',
  })
  @ApiResponse({ status: 200, description: 'Profile KPI counters' })
  @Get('me/stats')
  getMyStats(@CurrentUser('sub') requesterId: string) {
    return this.usersService.getMyStats(requesterId);
  }

  @ApiOperation({ summary: "Recent actions performed by the current admin, for the profile activity timeline" })
  @ApiResponse({ status: 200, description: 'Notifications this admin triggered, newest first' })
  @Get('me/activity')
  getMyActivity(@CurrentUser('sub') requesterId: string, @Query('limit') limit?: string) {
    return this.usersService.getMyActivity(requesterId, limit ? Number(limit) : undefined);
  }

  @ApiOperation({ summary: "Set or replace the current admin's avatar URL (upload the file via POST /files/upload first)" })
  @ApiResponse({ status: 200, description: 'Updated user' })
  @Patch('me/avatar')
  setMyAvatar(@Body('avatarUrl') avatarUrl: string, @CurrentUser('sub') requesterId: string, @CurrentUser('role') requesterRole: Role) {
    return this.usersService.update(requesterId, { avatarUrl }, requesterId, requesterRole);
  }

  @ApiOperation({ summary: "Remove the current admin's avatar" })
  @ApiResponse({ status: 200, description: 'Updated user' })
  @Delete('me/avatar')
  removeMyAvatar(@CurrentUser('sub') requesterId: string, @CurrentUser('role') requesterRole: Role) {
    return this.usersService.update(requesterId, { avatarUrl: '' }, requesterId, requesterRole);
  }

  @Patch(':id/admin')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  adminUpdate(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser('role') requesterRole: Role,
  ) {
    return this.usersService.adminUpdate(id.toString(), dto, requesterRole);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body('status') status: UserStatus,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.usersService.updateStatus(id.toString(), status, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @CurrentUser('sub') adminId: string) {
    return this.usersService.remove(id.toString(), adminId);
  }
}
