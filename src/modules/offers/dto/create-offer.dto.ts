import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlasticType } from '../../../common/enums/plastic-type.enum';
import { OfferStatus } from '../../../common/enums/offer-status.enum';

class LocationDto {
  @ApiProperty({ description: 'City name' })
  @IsString() city: string;

  @ApiProperty({ description: 'Governorate / zone' })
  @IsString() zone: string;

  @ApiPropertyOptional({ type: [Number], description: '[longitude, latitude]' })
  @IsOptional() @IsArray() coordinates?: number[];

  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
}

export class CreateOfferDto {
  @ApiProperty({ maxLength: 100 })
  @IsString() @MaxLength(100) title: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional() @IsString() @MaxLength(1000) description?: string;

  @ApiProperty({ enum: PlasticType })
  @IsEnum(PlasticType) plasticType: PlasticType;

  @ApiPropertyOptional({ description: 'Plastic sub-category' })
  @IsOptional() @IsString() category?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional() @IsNumber() @Min(0) quantityKg?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional() @IsNumber() @Min(0) quantityPiece?: number;

  @ApiPropertyOptional({ default: 'kg' })
  @IsOptional() @IsString() unit?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional() @IsNumber() @Min(0) pricePerKg?: number;

  @ApiProperty()
  @IsBoolean() isFree: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString() availability?: string;

  @ApiProperty({ type: LocationDto })
  @ValidateNested() @Type(() => LocationDto) location: LocationDto;

  @ApiPropertyOptional({ type: [String], description: 'Cloudinary image URLs' })
  @IsOptional() @IsArray() images?: string[];

  @ApiPropertyOptional({ description: 'Cloudinary voice recording URL' })
  @IsOptional() @IsString() voiceUrl?: string;

  @ApiPropertyOptional({ minimum: 0, description: 'Voice duration in seconds' })
  @IsOptional() @IsNumber() @Min(0) voiceDuration?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() recyclingCondition?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() collectionMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() packaging?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;

  @ApiPropertyOptional({ enum: OfferStatus, default: OfferStatus.ACTIVE })
  @IsOptional() @IsEnum(OfferStatus) status?: OfferStatus;
}
