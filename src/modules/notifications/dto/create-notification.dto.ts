import { IsString, IsMongoId, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsMongoId() recipientId: string;
  @IsString() type: string;
  @IsString() title: string;
  @IsString() body: string;
  @IsOptional() @IsString() link?: string;
}
