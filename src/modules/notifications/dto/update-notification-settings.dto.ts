import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class ChannelTogglesDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() email?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() dashboard?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() mobile?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() push?: boolean;
}

export class CategoryToggleDto {
  @ApiPropertyOptional() @IsString() category: string;
  @ApiPropertyOptional() @IsBoolean() enabled: boolean;
}

export class NotificationTemplateDto {
  @ApiPropertyOptional() @IsString() type: string;
  @ApiPropertyOptional() @IsString() title: string;
  @ApiPropertyOptional() @IsString() message: string;
}

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ type: ChannelTogglesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelTogglesDto)
  channels?: ChannelTogglesDto;

  @ApiPropertyOptional({ type: [CategoryToggleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryToggleDto)
  categories?: CategoryToggleDto[];

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(3650) retentionDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() realtimeEnabled?: boolean;

  @ApiPropertyOptional({ type: [NotificationTemplateDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationTemplateDto)
  templates?: NotificationTemplateDto[];
}
