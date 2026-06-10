import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackModule } from './feedback/feedback.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/recaplink',
    ),
    FeedbackModule,
  ],
})
export class AppModule {}
