import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty() _id: string;
  @ApiProperty() recipient: string;
  @ApiProperty() type: string;
  @ApiProperty() category: string;
  @ApiProperty() title: string;
  @ApiProperty() message: string;
  @ApiPropertyOptional() icon?: string;
  @ApiPropertyOptional() color?: string;
  @ApiProperty() link: string;
  @ApiProperty() isRead: boolean;
  @ApiPropertyOptional() createdBy?: string;
  @ApiPropertyOptional() metadata?: Record<string, unknown>;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] }) data: NotificationResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
