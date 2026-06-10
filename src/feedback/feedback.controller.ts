import { Controller, Get, Post, Body } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto);
  }

  @Get('stats')
  getStats() {
    return this.feedbackService.getStats();
  }

  @Get()
  findAll() {
    return this.feedbackService.findAll();
  }
}
