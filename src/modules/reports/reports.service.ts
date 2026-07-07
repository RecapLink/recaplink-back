import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { Offer, OfferDocument } from '../offers/schemas/offer.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ReportReason } from '../../common/enums/report-reason.enum';
import { OfferStatus } from '../../common/enums/offer-status.enum';
import { NotificationsService } from '../notifications/notifications.service';

const OFFER_SUMMARY_FIELDS = 'title images location status quantityKg quantityPiece refCode owner';
const USER_SUMMARY_FIELDS = 'fullName username';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private readonly model: Model<ReportDocument>,
    @InjectModel(Offer.name) private readonly offerModel: Model<OfferDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateReportDto, reportedById: string): Promise<ReportDocument> {
    if (dto.reason === ReportReason.OTHER && !dto.comment?.trim()) {
      throw new BadRequestException('comment is required when reason is "other"');
    }

    const offer = await this.offerModel.findById(new Types.ObjectId(dto.offerId));
    if (!offer) throw new NotFoundException('Offer not found');

    const report = await this.model.create({
      offerId: offer._id,
      reportedBy: new Types.ObjectId(reportedById),
      reason: dto.reason,
      comment: dto.comment,
    });

    await this.offerModel.findByIdAndUpdate(offer._id, { status: OfferStatus.REPORTED });

    await this.notificationsService.notifyAdmins({
      type: 'report',
      title: 'Nouveau signalement',
      message: `${offer.title} a été signalée`,
      link: '/admin/offers',
      createdBy: reportedById,
      prefKey: 'newSignalement',
      metadata: { offerId: offer._id.toString(), reportId: report._id.toString() },
    });

    return this.populate(report);
  }

  async findAll(query: { status?: string; offerId?: string; page?: number; limit?: number }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.offerId) filter.offerId = new Types.ObjectId(query.offerId);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('offerId', OFFER_SUMMARY_FIELDS)
        .populate('reportedBy', USER_SUMMARY_FIELDS)
        .populate('reviewedBy', USER_SUMMARY_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<ReportDocument> {
    const report = await this.model
      .findById(new Types.ObjectId(id))
      .populate('offerId', OFFER_SUMMARY_FIELDS)
      .populate('reportedBy', USER_SUMMARY_FIELDS)
      .populate('reviewedBy', USER_SUMMARY_FIELDS);
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async review(id: string, adminId: string, dto: ReviewReportDto): Promise<ReportDocument> {
    const report = await this.model.findById(new Types.ObjectId(id));
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'pending') throw new ConflictException('This report has already been reviewed');

    const offer = await this.offerModel.findById(report.offerId);
    if (!offer) throw new NotFoundException('Offer not found');

    report.status = dto.status;
    report.decisionComment = dto.decisionComment;
    report.reviewedBy = new Types.ObjectId(adminId);
    report.reviewedAt = new Date();
    await report.save();

    if (dto.status === 'approved') {
      await this.offerModel.findByIdAndUpdate(offer._id, { status: OfferStatus.SUSPENDED });

      await this.notificationsService.create({
        recipientId: offer.owner.toString(),
        type: 'report_approved',
        title: 'Votre offre a été suspendue',
        message: `${offer.title} a été suspendue suite à un signalement`,
        link: `/offers/${offer._id.toString()}`,
        createdBy: adminId,
        metadata: { offerId: offer._id.toString(), reportId: report._id.toString() },
      });

      await this.notificationsService.notifyAdmins({
        type: 'report_approved',
        title: 'Signalement approuvé',
        message: `Le signalement sur "${offer.title}" a été approuvé — offre suspendue`,
        link: '/admin/offers',
        createdBy: adminId,
        metadata: { offerId: offer._id.toString(), reportId: report._id.toString() },
      });
    } else {
      await this.offerModel.findByIdAndUpdate(offer._id, { status: OfferStatus.ACTIVE });

      await this.notificationsService.create({
        recipientId: report.reportedBy.toString(),
        type: 'report_rejected',
        title: 'Signalement rejeté',
        message: `Votre signalement sur "${offer.title}" a été rejeté`,
        link: '/admin/offers',
        createdBy: adminId,
        metadata: { offerId: offer._id.toString(), reportId: report._id.toString() },
      });
    }

    return this.populate(report);
  }

  private async populate(report: ReportDocument): Promise<ReportDocument> {
    return report.populate([
      { path: 'offerId', select: OFFER_SUMMARY_FIELDS },
      { path: 'reportedBy', select: USER_SUMMARY_FIELDS },
      { path: 'reviewedBy', select: USER_SUMMARY_FIELDS },
    ]);
  }
}
