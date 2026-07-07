import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewReportDto {
  @ApiProperty({ enum: ['approved', 'rejected'], description: 'Moderation decision' })
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: "Moderator's note explaining the decision", maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  decisionComment?: string;
}
