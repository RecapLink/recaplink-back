import { IsString, IsInt, IsOptional, Min, Max, IsArray, IsIn } from 'class-validator';

export class CreateFeedbackDto {
  @IsOptional()
  @IsString()
  @IsIn(['en', 'fr', 'wo'])
  language?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  satisfaction?: number;

  @IsOptional()
  @IsString()
  @IsIn(['collector', 'recycler', 'business', 'individual', 'other'])
  profile?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['definitely_yes', 'probably_yes', 'unsure', 'probably_no', 'definitely_no'])
  wouldUse?: string;

  @IsOptional()
  @IsString()
  @IsIn(['social_media', 'event', 'colleague', 'internet', 'other'])
  heardFrom?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
