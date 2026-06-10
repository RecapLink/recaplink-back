import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ default: 'fr' })
  language: string;

  @Prop()
  satisfaction: number;

  @Prop()
  profile: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop()
  wouldUse: string;

  @Prop()
  heardFrom: string;

  @Prop()
  comment: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
