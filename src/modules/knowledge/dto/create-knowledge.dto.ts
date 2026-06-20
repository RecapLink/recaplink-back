import { IsString, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class I18nDto {
  @IsOptional() @IsString() fr?: string;
  @IsOptional() @IsString() ar?: string;
  @IsOptional() @IsString() wo?: string;
}

export class CreateKnowledgeDto {
  @ValidateNested() @Type(() => I18nDto) title: I18nDto;
  @ValidateNested() @Type(() => I18nDto) content: I18nDto;
  @IsEnum(['article', 'video', 'tutorial']) type: string;
  @IsString() category: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsString() coverColor?: string;
  @IsOptional() @IsString() videoDuration?: string;
  @IsOptional() slug?: string;
}
