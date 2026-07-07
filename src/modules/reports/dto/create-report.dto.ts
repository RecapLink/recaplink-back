import { IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportReason } from '../../../common/enums/report-reason.enum';

export class CreateReportDto {
  @ApiProperty({ description: 'MongoDB _id of the reported offer' })
  @IsMongoId()
  offerId: string;

  @ApiProperty({ enum: ReportReason, description: 'Single-choice reason for the report' })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({
    description: 'Free-text detail. Required by the service layer when reason is "other".',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
