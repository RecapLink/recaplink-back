import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class PasswordPolicyDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(6) @Max(64) minLength?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requireUppercase?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requireNumber?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requireSpecialChar?: boolean;
}

export class UpdateSecuritySettingsDto {
  @ApiPropertyOptional({ description: 'e.g. "15m", "1h"' })
  @IsOptional()
  @IsString()
  jwtExpiresIn?: string;

  @ApiPropertyOptional({ description: 'e.g. "7d", "30d"' })
  @IsOptional()
  @IsString()
  refreshTokenExpiresIn?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sessionTimeoutMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(20) maxLoginAttempts?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) lockoutDurationMinutes?: number;

  @ApiPropertyOptional({ type: PasswordPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PasswordPolicyDto)
  passwordPolicy?: PasswordPolicyDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(500) maxUploadSizeMb?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) apiRateLimitPerMinute?: number;
}
