import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSupportSettingsDto {
  @IsOptional() @IsBoolean() supportEnabled?: boolean;
  @IsOptional() @IsString() supportTitle?: string;
  @IsOptional() @IsString() supportStartHour?: string;
  @IsOptional() @IsString() supportEndHour?: string;
  @IsOptional() @IsString() supportPhone?: string;
  @IsOptional() @IsString() supportEmail?: string;
  @IsOptional() @IsString() supportIllustration?: string;
  @IsOptional() @IsString() supportBubbleColor?: string;
}
