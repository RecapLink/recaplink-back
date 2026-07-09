import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertProgressDto {
  @ApiProperty() @IsString() knowledgeId: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) progressPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) currentStep?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) markStepComplete?: number;
  @ApiPropertyOptional({ enum: ['in_progress', 'completed'] })
  @IsOptional() @IsEnum(['in_progress', 'completed'])
  status?: string;
}
