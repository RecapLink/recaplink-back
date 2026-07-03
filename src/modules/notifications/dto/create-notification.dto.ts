import { IsString, IsMongoId, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'MongoDB _id of the user who should receive the notification' })
  @IsMongoId()
  recipientId: string;

  @ApiProperty({ description: 'Specific event type, e.g. "offer_created", "user_deleted"' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message body' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Frontend route to navigate to when the notification is clicked' })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({ description: 'Arbitrary extra data related to the event (offerId, badgeId, etc.)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
