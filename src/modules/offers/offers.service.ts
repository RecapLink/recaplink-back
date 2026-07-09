import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from './schemas/offer.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferQueryDto } from './dto/offer-query.dto';
import { Role } from '../../common/enums/role.enum';
import { OfferStatus } from '../../common/enums/offer-status.enum';
import { NotificationsService } from '../notifications/notifications.service';

function generateRef(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RL-${year}-${rand}`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name) private readonly model: Model<OfferDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: OfferQueryDto) {
    const filter: any = {};
    if (query.plasticType) filter.plasticType = query.plasticType;
    if (query.zone) filter['location.zone'] = new RegExp(escapeRegex(query.zone), 'i');
    if (query.status === 'all') {
      // no status filter — used by the admin panel to show every offer regardless of status
    } else if (query.status) {
      filter.status = query.status;
    } else {
      filter.status = OfferStatus.ACTIVE;
    }
    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i');
      const matchingOwners = await this.userModel
        .find({ $or: [{ fullName: regex }, { username: regex }] })
        .select('_id')
        .lean();

      filter.$or = [
        { title: regex },
        { description: regex },
        { refCode: regex },
        { plasticType: regex },
        { 'location.city': regex },
        { 'location.zone': regex },
        ...(matchingOwners.length ? [{ owner: { $in: matchingOwners.map(u => u._id) } }] : []),
      ];
    }

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
    const offer = await this.model.create({
      ...rest,
      refCode: generateRef(),
      owner: new Types.ObjectId(userId),
      expiresAt,
      ...(status && { status }),
    });

    await this.notificationsService.notifyAdmins({
      type: 'offer_created',
      title: 'Nouvelle offre publiée',
      message: `${offer.title} — ${offer.plasticType}`,
      link: '/admin/offers',
      createdBy: userId,
      metadata: { offerId: offer._id.toString() },
    });

    return offer;
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
    const updated = await this.model
      .findByIdAndUpdate(new Types.ObjectId(id), dto, { new: true })
      .populate('owner', 'fullName username avatarUrl rating');

    await this.notificationsService.notifyAdmins({
      type: 'offer_updated',
      title: 'Offre modifiée',
      message: `${updated.title} a été mise à jour`,
      link: '/admin/offers',
      createdBy: userId,
      metadata: { offerId: id },
    });

    return updated;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const offer = await this.model.findById(new Types.ObjectId(id));
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.owner.toString() !== userId && userRole !== Role.ADMIN) throw new ForbiddenException();
    await this.model.deleteOne({ _id: new Types.ObjectId(id) });

    await this.notificationsService.notifyAdmins({
      type: 'offer_deleted',
      title: 'Offre supprimée',
      message: `${offer.title} a été supprimée`,
      createdBy: userId,
      metadata: { offerId: id },
    });
  }

  async myOffers(userId: string) {
    return this.model
      .find({ owner: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async verify(id: string, adminId: string): Promise<OfferDocument> {
    const offer = await this.model.findByIdAndUpdate(
      new Types.ObjectId(id),
      { status: OfferStatus.VERIFIED },
      { new: true },
    );
    if (!offer) throw new NotFoundException('Offer not found');

    await this.notificationsService.notifyAdmins({
      type: 'offer_approved',
      title: 'Offre approuvée',
      message: `${offer.title} a été approuvée`,
      link: '/admin/offers',
      createdBy: adminId,
      metadata: { offerId: id },
    });

    await this.notificationsService.create({
      recipientId: offer.owner.toString(),
      type: 'offer_approved',
      title: 'Votre offre a été approuvée',
      message: `${offer.title} a été approuvée`,
      link: `/offers/${id}`,
      createdBy: adminId,
      metadata: { offerId: id },
    });

    return offer;
  }

  async updateStatus(id: string, status: OfferStatus, adminId: string): Promise<OfferDocument> {
    const offer = await this.model.findByIdAndUpdate(
      new Types.ObjectId(id),
      { status },
      { new: true },
    );
    if (!offer) throw new NotFoundException('Offer not found');

    if (status === OfferStatus.SUSPENDED) {
      await this.notificationsService.notifyAdmins({
        type: 'offer_rejected',
        title: 'Offre rejetée / suspendue',
        message: `${offer.title} a été suspendue`,
        link: '/admin/offers',
        createdBy: adminId,
        metadata: { offerId: id },
      });

      await this.notificationsService.create({
        recipientId: offer.owner.toString(),
        type: 'offer_rejected',
        title: 'Votre offre a été suspendue',
        message: `${offer.title} a été suspendue`,
        link: `/offers/${id}`,
        createdBy: adminId,
        metadata: { offerId: id },
      });
    } else if (status === OfferStatus.ACTIVE) {
      await this.notificationsService.notifyAdmins({
        type: 'offer_approved',
        title: 'Offre réactivée',
        message: `${offer.title} a été réactivée`,
        link: '/admin/offers',
        createdBy: adminId,
        metadata: { offerId: id },
      });

      await this.notificationsService.create({
        recipientId: offer.owner.toString(),
        type: 'offer_approved',
        title: 'Votre offre a été réactivée',
        message: `${offer.title} a été réactivée`,
        link: `/offers/${id}`,
        createdBy: adminId,
        metadata: { offerId: id },
      });
    }

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
