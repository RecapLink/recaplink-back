import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddTicketMessageDto {
  @ApiProperty() @IsString() @IsNotEmpty() body: string;

  @ApiPropertyOptional({ description: 'URL returned by POST /files/upload' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
