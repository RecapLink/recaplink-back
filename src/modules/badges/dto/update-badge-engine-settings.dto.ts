import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateBadgeEngineSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() autoBadgesEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['hourly', 'daily', 'weekly', 'manual'] })
  @IsOptional()
  @IsIn(['hourly', 'daily', 'weekly', 'manual'])
  recalculationFrequency?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() manualOverrideAllowed?: boolean;
}
