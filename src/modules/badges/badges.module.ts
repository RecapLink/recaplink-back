import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Badge, BadgeSchema } from './schemas/badge.schema';
import { UserBadge, UserBadgeSchema } from './schemas/user-badge.schema';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Badge.name, schema: BadgeSchema },
      { name: UserBadge.name, schema: UserBadgeSchema },
    ]),
  ],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
