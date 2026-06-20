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
import { PlasticType } from '../../../common/enums/plastic-type.enum';

class LocationDto {
  @IsString() city: string;
  @IsString() zone: string;
  @IsOptional() @IsArray() coordinates?: number[];
}

export class CreateOfferDto {
  @IsString() @MaxLength(100) title: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsEnum(PlasticType) plasticType: PlasticType;
  @IsOptional() @IsNumber() @Min(0) quantityKg?: number;
  @IsOptional() @IsNumber() @Min(0) quantityPiece?: number;
  @IsOptional() @IsNumber() @Min(0) pricePerKg?: number;
  @IsBoolean() isFree: boolean;
  @ValidateNested() @Type(() => LocationDto) location: LocationDto;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsString() availability?: string;
}
