import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportReason } from '../../../common/enums/report-reason.enum';

export class ReportResponseDto {
  @ApiProperty() _id: string;
  @ApiProperty({ description: 'Populated offer summary (title, images, location, status, quantity, refCode)' })
  offerId: unknown;
  @ApiProperty({ description: 'Populated reporter summary (fullName, username)' })
  reportedBy: unknown;
  @ApiProperty({ enum: ReportReason }) reason: ReportReason;
  @ApiPropertyOptional() comment?: string;
  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] }) status: string;
  @ApiPropertyOptional({ description: 'Populated moderator summary (fullName, username)' })
  reviewedBy?: unknown;
  @ApiPropertyOptional() reviewedAt?: string;
  @ApiPropertyOptional() decisionComment?: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class ReportListResponseDto {
  @ApiProperty({ type: [ReportResponseDto] }) data: ReportResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
