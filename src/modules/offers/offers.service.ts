import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from './schemas/offer.schema';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferQueryDto } from './dto/offer-query.dto';
import { Role } from '../../common/enums/role.enum';
import { OfferStatus } from '../../common/enums/offer-status.enum';

function generateRef(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RL-${year}-${rand}`;
}

@Injectable()
export class OffersService {
  constructor(@InjectModel(Offer.name) private readonly model: Model<OfferDocument>) {}

  async findAll(query: OfferQueryDto) {
    const filter: any = {};
    if (query.plasticType) filter.plasticType = query.plasticType;
    if (query.zone) filter['location.zone'] = new RegExp(query.zone, 'i');
    if (query.status === 'all') {
      // no status filter — used by the admin panel to show every offer regardless of status
    } else if (query.status) {
      filter.status = query.status;
    } else {
      filter.status = OfferStatus.ACTIVE;
    }
    if (query.search)
      filter.$or = [
        { title: new RegExp(query.search, 'i') },
        { description: new RegExp(query.search, 'i') },
      ];

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('owner', 'fullName username avatarUrl rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<OfferDocument> {
    const offer = await this.model
      .findByIdAndUpdate(new Types.ObjectId(id), { $inc: { viewCount: 1 } }, { new: true })
      .populate('owner', 'fullName username avatarUrl rating phone zone city');
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async create(dto: CreateOfferDto, userId: string): Promise<OfferDocument> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const { status, ...rest } = dto;
    return this.model.create({
      ...rest,
      refCode: generateRef(),
      owner: new Types.ObjectId(userId),
      expiresAt,
      ...(status && { status }),
    });
  }

  async update(
    id: string,
    dto: UpdateOfferDto,
    userId: string,
    userRole: string,
  ): Promise<OfferDocument> {
    const offer = await this.model.findById(new Types.ObjectId(id));
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.owner.toString() !== userId && userRole !== Role.ADMIN) throw new ForbiddenException();
    return this.model
      .findByIdAndUpdate(new Types.ObjectId(id), dto, { new: true })
      .populate('owner', 'fullName username avatarUrl rating');
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const offer = await this.model.findById(new Types.ObjectId(id));
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.owner.toString() !== userId && userRole !== Role.ADMIN) throw new ForbiddenException();
    await this.model.deleteOne({ _id: new Types.ObjectId(id) });
  }

  async myOffers(userId: string) {
    return this.model
      .find({ owner: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async verify(id: string): Promise<OfferDocument> {
    return this.model.findByIdAndUpdate(
      new Types.ObjectId(id),
      { status: OfferStatus.VERIFIED },
      { new: true },
    );
  }

  async updateStatus(id: string, status: OfferStatus): Promise<OfferDocument> {
    const offer = await this.model.findByIdAndUpdate(
      new Types.ObjectId(id),
      { status },
      { new: true },
    );
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async close(id: string, userId: string): Promise<OfferDocument> {
    const offer = await this.model.findById(new Types.ObjectId(id));
    if (!offer) throw new NotFoundException();
    if (offer.owner.toString() !== userId) throw new ForbiddenException();
    return this.model.findByIdAndUpdate(
      new Types.ObjectId(id),
      { status: OfferStatus.CLOSED },
      { new: true },
    );
  }

  async findSimilar(id: string) {
    const offer = await this.model.findById(new Types.ObjectId(id));
    if (!offer) return [];
    return this.model
      .find({
        _id: { $ne: new Types.ObjectId(id) },
        plasticType: offer.plasticType,
        status: OfferStatus.ACTIVE,
      })
      .limit(4)
      .populate('owner', 'fullName username avatarUrl')
      .lean();
  }

  async countActive(): Promise<number> {
    return this.model.countDocuments({ status: OfferStatus.ACTIVE });
  }
}
