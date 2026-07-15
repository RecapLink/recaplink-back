import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Language } from '../../../common/enums/language.enum';

export class UpdateLocalizationSettingsDto {
  @ApiPropertyOptional({ enum: Language })
  @IsOptional()
  @IsEnum(Language)
  defaultLanguage?: Language;

  @ApiPropertyOptional({ enum: Language, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Language, { each: true })
  availableLanguages?: Language[];

  @ApiPropertyOptional() @IsOptional() @IsString() defaultCountry?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateFormat?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numberFormat?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
}
