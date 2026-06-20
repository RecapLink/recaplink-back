import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlasticType } from '../../../common/enums/plastic-type.enum';
import { OfferStatus } from '../../../common/enums/offer-status.enum';

export type OfferDocument = Offer & Document;

class OfferLocation {
  @Prop({ required: true }) city: string;
  @Prop({ required: true }) zone: string;
  @Prop({ type: [Number], default: [] }) coordinates: number[];
}

@Schema({ timestamps: true })
export class Offer {
  @Prop({ required: true, unique: true }) refCode: string;
  @Prop({ required: true }) title: string;
  @Prop() description: string;
  @Prop({ required: true, enum: PlasticType }) plasticType: PlasticType;
  @Prop({ default: 0 }) quantityKg: number;
  @Prop({ default: 0 }) quantityPiece: number;
  @Prop({ default: 0 }) pricePerKg: number;
  @Prop({ default: false }) isFree: boolean;
  @Prop({ type: OfferLocation, required: true }) location: OfferLocation;
  @Prop({ type: [String], default: [] }) images: string[];
  @Prop({ enum: OfferStatus, default: OfferStatus.ACTIVE }) status: OfferStatus;
  @Prop() availability: string;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) owner: Types.ObjectId;
  @Prop({ default: 0 }) viewCount: number;
  @Prop({ default: 0 }) messageCount: number;
  @Prop() expiresAt: Date;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
OfferSchema.index({ owner: 1, status: 1 });
OfferSchema.index({ plasticType: 1, status: 1 });
OfferSchema.index({ 'location.zone': 1 });
OfferSchema.index({ createdAt: -1 });
