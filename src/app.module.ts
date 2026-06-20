import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FeedbackModule } from './feedback/feedback.module';
import { FilesModule } from './modules/files/files.module';
import { OffersModule } from './modules/offers/offers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { MessagingModule } from './modules/conversations/messaging.module';
import { BadgesModule } from './modules/badges/badges.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AnalyticsModule } from './modules/stats/analytics.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL') ?? 60000,
            limit: config.get<number>('THROTTLE_LIMIT') ?? 100,
          },
        ],
      }),
    }),

    AuthModule,
    UsersModule,
    FeedbackModule,
    FilesModule,
    OffersModule,
    NotificationsModule,
    KnowledgeModule,
    MessagingModule,
    BadgesModule,
    ReportsModule,
    AnalyticsModule,
    ChatbotModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
