import { IsString, IsEnum, IsOptional, IsArray, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeConditionalString, TypeConditionalArray, RequiredI18nFrForTypes, ValidTutorialSteps } from './type-conditional.validators';

class I18nDto {
  @ApiPropertyOptional() @IsOptional() @IsString() fr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ar?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() wo?: string;
}

class AttachmentDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() url: string;
  @ApiProperty() @IsString() mimeType: string;
}

class KnowledgeStepDto {
  @ApiProperty({ type: I18nDto }) @ValidateNested() @Type(() => I18nDto) title: I18nDto;
  @ApiProperty({ type: I18nDto }) @ValidateNested() @Type(() => I18nDto) description: I18nDto;
  @ApiPropertyOptional() @IsOptional() @IsNumber() order?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
}

export class CreateKnowledgeDto {
  @ApiProperty({ type: I18nDto }) @ValidateNested() @Type(() => I18nDto) title: I18nDto;
  @ApiPropertyOptional({ type: I18nDto }) @IsOptional() @ValidateNested() @Type(() => I18nDto) subtitle?: I18nDto;
  @ApiProperty({ type: I18nDto })
  @ValidateNested() @Type(() => I18nDto)
  @RequiredI18nFrForTypes(['article', 'video'], 'Le contenu (FR) est requis pour ce type de contenu')
  content: I18nDto;
  @ApiProperty({ enum: ['article', 'video', 'tutorial'] })
  @IsEnum(['article', 'video', 'tutorial'])
  type: string;
  @ApiProperty() @IsString() category: string;
  @ApiPropertyOptional({ enum: ['debutant', 'intermediaire', 'avance'] })
  @IsOptional() @IsEnum(['debutant', 'intermediaire', 'avance'])
  difficulty?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() coverImageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bannerUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coverColor?: string;
  @ApiPropertyOptional()
  @TypeConditionalString({
    requiredFor: ['video'],
    forbiddenFor: ['article', 'tutorial'],
    requiredMessage: 'La vidéo est requise pour un contenu de type Vidéo',
    forbiddenMessage: "La vidéo n'est autorisée que pour le type Vidéo",
  })
  videoUrl?: string;
  @ApiPropertyOptional()
  @TypeConditionalString({
    forbiddenFor: ['video', 'tutorial'],
    forbiddenMessage: "Le PDF n'est autorisé que pour le type Article",
  })
  pdfUrl?: string;
  @ApiPropertyOptional({ type: [AttachmentDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
  @ApiPropertyOptional({ type: [String] })
  @TypeConditionalArray({
    forbiddenFor: ['video', 'tutorial'],
    forbiddenMessage: "Les images ne sont autorisées que pour le type Article",
  })
  images?: string[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() seoTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() recommended?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pinned?: boolean;
  @ApiPropertyOptional({ type: [KnowledgeStepDto] })
  @Type(() => KnowledgeStepDto)
  @ValidTutorialSteps()
  steps?: KnowledgeStepDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() videoDuration?: string;
  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional() @IsEnum(['draft', 'published', 'archived'])
  status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
}
