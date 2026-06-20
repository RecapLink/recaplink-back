import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';

@Injectable()
export class ReportsService {
  constructor(@InjectModel(Report.name) private readonly model: Model<ReportDocument>) {}

  async create(
    type: string,
    targetId: string,
    reporterId: string,
    reason: string,
  ): Promise<ReportDocument> {
    return this.model.create({
      type,
      targetId: new Types.ObjectId(targetId),
      reporter: new Types.ObjectId(reporterId),
      reason,
    });
  }

  async findAll(query: { status?: string; type?: string; page?: number; limit?: number }) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('reporter', 'fullName username')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async review(
    id: string,
    adminId: string,
    status: string,
    adminNote?: string,
  ): Promise<ReportDocument> {
    return this.model.findByIdAndUpdate(
      new Types.ObjectId(id),
      {
        status,
        adminNote,
        reviewedBy: new Types.ObjectId(adminId),
        reviewedAt: new Date(),
      },
      { new: true },
    );
  }
}
