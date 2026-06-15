import { IsString, IsInt, IsOptional, Min, Max, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFeedbackDto {
  @IsOptional() @IsString() @IsIn(['ar', 'fr', 'wo'])
  language?: string;

  // Section 1
  @IsOptional() @IsInt() @Min(1) @Max(5) @Type(() => Number)
  satisfaction?: number;

  @IsOptional() @IsInt() @Min(1) @Max(5) @Type(() => Number)
  designRating?: number;

  // Section 2
  @IsOptional() @IsString() @IsIn(['excellent', 'good', 'average', 'poor'])
  colorScheme?: string;

  @IsOptional() @IsString() @IsIn(['very_clear', 'clear', 'hard'])
  textReadability?: string;

  @IsOptional() @IsString() @IsIn(['very_intuitive', 'intuitive', 'confusing', 'very_confusing'])
  navIntuition?: string;

  @IsOptional() @IsString() @IsIn(['very_useful', 'useful', 'neutral', 'not_useful', 'not_used'])
  savoirFaire?: string;

  // Section 3
  @IsOptional() @IsString() @IsIn(['very_simple', 'simple', 'moderate', 'complex', 'very_complex'])
  complexity?: string;

  @IsOptional() @IsString() @IsIn(['excellent', 'good', 'average', 'difficult'])
  onboarding?: string;

  @IsOptional() @IsString() @IsIn(['very_easy', 'easy', 'moderate', 'hard'])
  registrationEase?: string;

  @IsOptional() @IsString() @IsIn(['very_easy', 'easy', 'moderate', 'hard'])
  postOfferEase?: string;

  @IsOptional() @IsString() @IsIn(['very_easy', 'easy', 'moderate', 'hard'])
  searchCollectorEase?: string;

  // Section 4
  @IsOptional() @IsInt() @Min(1) @Max(5) @Type(() => Number)
  messagingRating?: number;

  @IsOptional() @IsInt() @Min(1) @Max(5) @Type(() => Number)
  chatbotRating?: number;

  @IsOptional() @IsString() @IsIn(['very_satisfied', 'satisfied', 'little', 'not_satisfied'])
  badgeSatisfaction?: string;

  @IsOptional() @IsString() @IsIn(['very_useful', 'useful', 'neutral', 'not_useful'])
  profilePage?: string;

  @IsOptional() @IsArray() @IsString({ each: true }) @IsIn(['collect', 'connect', 'badges', 'ai_chatbot', 'messaging', 'eco_impact'], { each: true })
  favoriteFeature?: string[];

  // Section 5
  @IsOptional() @IsString() @IsIn(['daily', 'weekly', 'monthly', 'rarely', 'never'])
  usageFrequency?: string;

  @IsOptional() @IsString() @IsIn(['definitely', 'probably', 'maybe', 'no'])
  wouldRecommend?: string;

  @IsOptional() @IsString() @IsIn(['show_price', 'no_price', 'both_options'])
  offerPricePreference?: string;

  @IsOptional() @IsString()
  comment?: string;

  // Legacy
  @IsOptional() @IsString()
  profile?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  features?: string[];

  @IsOptional() @IsString()
  wouldUse?: string;

  @IsOptional() @IsString()
  heardFrom?: string;
}
