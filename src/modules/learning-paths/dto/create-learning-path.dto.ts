import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class I18nDto {
  @ApiPropertyOptional() @IsOptional() @IsString() fr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ar?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() wo?: string;
}

class LearningPathItemDto {
  @ApiProperty() @IsString() knowledge: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() order?: number;
}

export class CreateLearningPathDto {
  @ApiProperty({ type: I18nDto }) @ValidateNested() @Type(() => I18nDto) title: I18nDto;
  @ApiPropertyOptional({ type: I18nDto }) @IsOptional() @ValidateNested() @Type(() => I18nDto) description?: I18nDto;
  @ApiPropertyOptional({ type: [LearningPathItemDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LearningPathItemDto)
  items?: LearningPathItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() badge?: string;
  @ApiPropertyOptional({ enum: ['draft', 'published'] }) @IsOptional() @IsEnum(['draft', 'published']) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coverImageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
}
