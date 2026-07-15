import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Knowledge, KnowledgeSchema } from '../knowledge/schemas/knowledge.schema';
import { UserBadge, UserBadgeSchema } from '../badges/schemas/user-badge.schema';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      // Read-only access for the "me/stats" and "me/activity" profile KPIs —
      // registered here directly (not via KnowledgeModule/BadgesModule) to avoid
      // pulling in those modules' controllers/services just for two count queries.
      { name: Knowledge.name, schema: KnowledgeSchema },
      { name: UserBadge.name, schema: UserBadgeSchema },
    ]),
    NotificationsModule,
    SessionsModule,
  ],
  providers: [UsersRepository, UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
