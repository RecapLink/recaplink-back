import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateDashboardPrefsDto {
  @ApiPropertyOptional({ description: 'Play a sound when a new dashboard notification arrives' })
  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Show browser desktop notifications for dashboard events' })
  @IsOptional()
  @IsBoolean()
  desktopNotificationsEnabled?: boolean;
}
