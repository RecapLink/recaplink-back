import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketCategory, TicketPriority } from '../enums';

export class CreateTicketDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;

  @ApiProperty({ enum: TicketCategory }) @IsEnum(TicketCategory) category: TicketCategory;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty() @IsString() @IsNotEmpty() description: string;

  @ApiPropertyOptional({ description: 'URL returned by POST /files/upload' })
  @IsOptional()
  @IsString()
  screenshotUrl?: string;
}
