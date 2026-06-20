import { IsOptional, IsEnum, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PlasticType } from '../../../common/enums/plastic-type.enum';
import { OfferStatus } from '../../../common/enums/offer-status.enum';

export class OfferQueryDto {
  @IsOptional() @IsEnum(PlasticType) plasticType?: PlasticType;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(OfferStatus) status?: OfferStatus;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) limit?: number = 10;
}
