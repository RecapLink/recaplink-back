import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Language } from '../../../common/enums/language.enum';

class LocalizedMessageDto {
  @ApiPropertyOptional() @IsOptional() @IsString() fr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ar?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() wo?: string;
}

export class UpdateChatbotSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() aiProvider?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() model?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(2) temperature?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) maxTokens?: number;

  @ApiPropertyOptional({ enum: Language, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Language, { each: true })
  supportedLanguages?: Language[];

  @ApiPropertyOptional({ type: LocalizedMessageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedMessageDto)
  greetingMessage?: LocalizedMessageDto;

  @ApiPropertyOptional({ type: LocalizedMessageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedMessageDto)
  fallbackMessage?: LocalizedMessageDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  knowledgeSourceIds?: string[];

  @ApiPropertyOptional() @IsOptional() @IsBoolean() moderationEnabled?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  moderationKeywords?: string[];

  @ApiPropertyOptional() @IsOptional() @IsBoolean() analyticsEnabled?: boolean;
}
