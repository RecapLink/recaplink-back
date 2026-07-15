import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Badge, BadgeSchema } from './schemas/badge.schema';
import { UserBadge, UserBadgeSchema } from './schemas/user-badge.schema';
import { BadgeEngineSettings, BadgeEngineSettingsSchema } from './schemas/badge-engine-settings.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Offer, OfferSchema } from '../offers/schemas/offer.schema';
import { BadgesService } from './badges.service';
import { BadgeEngineService } from './badge-engine.service';
import { BadgeEngineSettingsService } from './badge-engine-settings.service';
import { BadgesController } from './badges.controller';
import { BadgeEngineController } from './badge-engine.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Badge.name, schema: BadgeSchema },
      { name: UserBadge.name, schema: UserBadgeSchema },
      { name: BadgeEngineSettings.name, schema: BadgeEngineSettingsSchema },
      { name: User.name, schema: UserSchema },
      { name: Offer.name, schema: OfferSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [BadgesController, BadgeEngineController],
  providers: [BadgesService, BadgeEngineService, BadgeEngineSettingsService],
  exports: [BadgesService],
})
export class BadgesModule {}
