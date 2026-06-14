import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ default: 'fr' })
  language: string;

  // ── Section 1: Satisfaction générale ──────────────────────────────
  @Prop()
  satisfaction: number; // 1-5 stars — overall

  @Prop()
  designRating: number; // 1-5 stars — visual design quality

  // ── Section 2: Design & Interface ─────────────────────────────────
  @Prop()
  colorScheme: string; // excellent | good | average | poor

  @Prop()
  textReadability: string; // very_clear | clear | hard

  @Prop()
  navIntuition: string; // very_intuitive | intuitive | confusing | very_confusing

  @Prop()
  savoirFaire: string; // very_useful | useful | neutral | not_useful | not_used

  // ── Section 3: Expérience utilisateur ─────────────────────────────
  @Prop()
  complexity: string; // very_simple | simple | moderate | complex | very_complex

  @Prop()
  onboarding: string; // excellent | good | average | difficult

  @Prop()
  registrationEase: string; // very_easy | easy | moderate | hard

  @Prop()
  postOfferEase: string; // very_easy | easy | moderate | hard

  @Prop()
  searchCollectorEase: string; // very_easy | easy | moderate | hard

  // ── Section 4: Fonctionnalités ────────────────────────────────────
  @Prop()
  messagingRating: number; // 1-5 stars

  @Prop()
  chatbotRating: number; // 1-5 stars

  @Prop()
  badgeSatisfaction: string; // very_satisfied | satisfied | little | not_satisfied

  @Prop()
  profilePage: string; // very_useful | useful | neutral | not_useful

  @Prop({ type: [String], default: [] })
  favoriteFeature: string[]; // collect | connect | badges | ai_chatbot | messaging | eco_impact

  // ── Section 5: Recommandation ─────────────────────────────────────
  @Prop()
  usageFrequency: string; // daily | weekly | monthly | rarely | never

  @Prop()
  wouldRecommend: string; // definitely | probably | maybe | no

  @Prop()
  comment: string;

  // ── Legacy fields (kept for backward compatibility) ───────────────
  @Prop()
  profile: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop()
  wouldUse: string;

  @Prop()
  heardFrom: string;

  createdAt: Date;
  updatedAt: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
