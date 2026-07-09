import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Knowledge, KnowledgeDocument } from './schemas/knowledge.schema';
import { KnowledgeView, KnowledgeViewDocument } from './schemas/knowledge-view.schema';
import { KnowledgeCategory, KnowledgeCategoryDocument } from './schemas/knowledge-category.schema';
import { KnowledgeProgress, KnowledgeProgressDocument } from './schemas/knowledge-progress.schema';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../../common/enums/role.enum';
import { assertValidKnowledgeType } from './knowledge-type-rules.util';

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now()
  );
}

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectModel(Knowledge.name) private readonly model: Model<KnowledgeDocument>,
    @InjectModel(KnowledgeView.name) private readonly viewModel: Model<KnowledgeViewDocument>,
    @InjectModel(KnowledgeCategory.name) private readonly categoryModel: Model<KnowledgeCategoryDocument>,
    @InjectModel(KnowledgeProgress.name) private readonly progressModel: Model<KnowledgeProgressDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: {
    type?: string;
    category?: string;
    difficulty?: string;
    status?: string;
    author?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    pinned?: boolean;
    recommended?: boolean;
    page?: number;
    limit?: number;
    admin?: boolean;
  }) {
    const filter: any = query.admin ? {} : { status: 'published' };
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.admin && query.status) filter.status = query.status;
    if (query.author) filter.author = new Types.ObjectId(query.author);
    if (query.pinned !== undefined) filter.pinned = query.pinned === true || (query.pinned as any) === 'true';
    if (query.recommended !== undefined) filter.recommended = query.recommended === true || (query.recommended as any) === 'true';
    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
    }
    if (query.search) filter['title.fr'] = new RegExp(query.search, 'i');

    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('author', 'fullName avatarUrl')
        .sort({ pinned: -1, pinOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string): Promise<KnowledgeDocument> {
    const item = await this.model
      .findOneAndUpdate({ slug }, { $inc: { viewCount: 1 } }, { new: true })
      .populate('author', 'fullName avatarUrl');
    if (!item) throw new NotFoundException('Knowledge item not found');

    try {
      await this.viewModel.create({ knowledge: item._id, viewedAt: new Date() });
    } catch {
      // never fail the page load over a view-logging write
    }

    return item;
  }

  private async nextPinOrder(): Promise<number> {
    const top = await this.model.findOne({ pinned: true }).sort({ pinOrder: -1 }).select('pinOrder').lean();
    return (top?.pinOrder ?? -1) + 1;
  }

  async create(dto: CreateKnowledgeDto, authorId: string): Promise<KnowledgeDocument> {
    assertValidKnowledgeType(dto);
    const slug = dto.slug || slugify(dto.title?.fr || 'article');
    const publishedAt = dto.status === 'published' ? new Date() : undefined;
    const pinOrder = dto.pinned && dto.pinOrder === undefined ? await this.nextPinOrder() : dto.pinOrder;
    const item = await this.model.create({
      ...dto,
      slug,
      author: new Types.ObjectId(authorId),
      ...(publishedAt ? { publishedAt } : {}),
      ...(dto.steps ? { stepCount: dto.steps.length } : {}),
      ...(dto.pinned ? { pinOrder } : {}),
    });

    await this.notificationsService.notifyAdmins({
      type: 'article_created',
      title: 'Nouvel article',
      message: `${item.title?.fr || slug} a été créé`,
      link: '/admin/knowledge',
      createdBy: authorId,
      metadata: { slug },
    });

    return item;
  }

  async update(slug: string, dto: Partial<CreateKnowledgeDto>, adminId: string): Promise<KnowledgeDocument> {
    const existing = await this.model.findOne({ slug }).lean();
    if (!existing) throw new NotFoundException('Knowledge item not found');

    const merged = { ...existing, ...dto };
    assertValidKnowledgeType(merged);

    const update: Record<string, unknown> = dto.steps ? { ...dto, stepCount: dto.steps.length } : { ...dto };
    if (dto.pinned === true && dto.pinOrder === undefined && !existing.pinned) {
      update.pinOrder = await this.nextPinOrder();
    }

    const item = await this.model.findOneAndUpdate({ slug }, update, { new: true });
    if (!item) throw new NotFoundException('Knowledge item not found');

    await this.notificationsService.notifyAdmins({
      type: 'article_updated',
      title: 'Article modifié',
      message: `${item.title?.fr || slug} a été mis à jour`,
      link: '/admin/knowledge',
      createdBy: adminId,
      metadata: { slug },
    });

    return item;
  }

  async remove(slug: string, adminId: string): Promise<void> {
    const item = await this.model.findOne({ slug });
    await this.model.deleteOne({ slug });

    await this.notificationsService.notifyAdmins({
      type: 'article_deleted',
      title: 'Article supprimé',
      message: `${item?.title?.fr || slug} a été supprimé`,
      createdBy: adminId,
      metadata: { slug },
    });
  }

  async toggleLike(slug: string, userId: string): Promise<KnowledgeDocument> {
    const uid = new Types.ObjectId(userId);
    const item = await this.model.findOne({ slug });
    if (!item) throw new NotFoundException();
    const liked = item.likedBy.some((id) => id.toString() === userId);
    if (liked) {
      return this.model.findOneAndUpdate(
        { slug },
        { $pull: { likedBy: uid }, $inc: { likeCount: -1 } },
        { new: true },
      );
    } else {
      return this.model.findOneAndUpdate(
        { slug },
        { $addToSet: { likedBy: uid }, $inc: { likeCount: 1 } },
        { new: true },
      );
    }
  }

  async publish(slug: string, adminId: string): Promise<KnowledgeDocument> {
    const existing = await this.model.findOne({ slug });
    if (!existing) throw new NotFoundException('Knowledge item not found');
    const update: any = { status: 'published' };
    if (!existing.publishedAt) update.publishedAt = new Date();
    const item = await this.model.findOneAndUpdate({ slug }, update, { new: true });
    if (!item) throw new NotFoundException('Knowledge item not found');

    await this.notificationsService.notifyAdmins({
      type: 'article_published',
      title: 'Article publié',
      message: `${item.title?.fr || slug} a été publié`,
      link: '/admin/knowledge',
      createdBy: adminId,
      metadata: { slug },
    });

    await this.notificationsService.notifyRoles({
      roles: [Role.COLLECTEUR, Role.RECYCLEUR],
      type: 'article_published',
      title: 'Nouvel article disponible',
      message: `${item.title?.fr || slug} est maintenant disponible`,
      link: `/knowledge/${slug}`,
      excludeUserId: adminId,
      metadata: { slug },
    });

    return item;
  }

  async archive(slug: string, adminId: string): Promise<KnowledgeDocument> {
    const item = await this.model.findOneAndUpdate({ slug }, { status: 'archived' }, { new: true });
    if (!item) throw new NotFoundException('Knowledge item not found');

    await this.notificationsService.notifyAdmins({
      type: 'article_unpublished',
      title: 'Article archivé',
      message: `${item.title?.fr || slug} a été archivé`,
      link: '/admin/knowledge',
      createdBy: adminId,
      metadata: { slug },
    });

    return item;
  }

  async pin(slug: string, adminId: string): Promise<KnowledgeDocument> {
    const pinOrder = await this.nextPinOrder();
    const item = await this.model.findOneAndUpdate({ slug }, { pinned: true, pinOrder }, { new: true });
    if (!item) throw new NotFoundException('Knowledge item not found');

    await this.notificationsService.notifyAdmins({
      type: 'article_pinned',
      title: 'Fiche épinglée',
      message: `${item.title?.fr || slug} a été épinglée`,
      link: '/admin/knowledge',
      createdBy: adminId,
      metadata: { slug },
    });

    return item;
  }

  async unpin(slug: string, adminId: string): Promise<KnowledgeDocument> {
    const item = await this.model.findOneAndUpdate({ slug }, { pinned: false }, { new: true });
    if (!item) throw new NotFoundException('Knowledge item not found');

    await this.notificationsService.notifyAdmins({
      type: 'article_unpinned',
      title: 'Fiche désépinglée',
      message: `${item.title?.fr || slug} n'est plus épinglée`,
      link: '/admin/knowledge',
      createdBy: adminId,
      metadata: { slug },
    });

    return item;
  }

  async getStatistics() {
    const [byType, byStatus, totals, mostViewed, topCategoriesAgg, completionAgg, mostCompletedTutorialsAgg] =
      await Promise.all([
        this.model.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
        this.model.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        this.model.aggregate([
          { $group: { _id: null, totalViews: { $sum: '$viewCount' }, totalLikes: { $sum: '$likeCount' } } },
        ]),
        this.model
          .find({ status: 'published' })
          .sort({ viewCount: -1 })
          .limit(5)
          .select('title slug type viewCount likeCount coverImageUrl')
          .lean(),
        this.model.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 }, views: { $sum: '$viewCount' } } },
          { $sort: { views: -1 } },
          { $limit: 5 },
        ]),
        this.progressModel.aggregate([
          {
            $group: {
              _id: null,
              started: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            },
          },
        ]),
        this.progressModel.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: '$knowledge', completions: { $sum: 1 } } },
          { $sort: { completions: -1 } },
          { $limit: 5 },
          {
            $lookup: { from: 'knowledges', localField: '_id', foreignField: '_id', as: 'knowledge' },
          },
          { $unwind: '$knowledge' },
          { $match: { 'knowledge.type': 'tutorial' } },
          { $project: { title: '$knowledge.title', slug: '$knowledge.slug', completions: 1 } },
        ]),
      ]);

    const typeCounts: Record<string, number> = { article: 0, video: 0, tutorial: 0 };
    byType.forEach((t: any) => { if (t._id) typeCounts[t._id] = t.count; });

    const statusCounts: Record<string, number> = { draft: 0, published: 0, archived: 0 };
    byStatus.forEach((s: any) => { if (s._id) statusCounts[s._id] = s.count; });

    // 12-month bucket builder, same technique as AnalyticsService.getRegistrationsByMonth()
    const months: Array<{ start: Date; end: Date; label: string }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      months.push({ start: d, end, label: d.toLocaleDateString('fr-FR', { month: 'short' }) });
    }
    const twelveMonthsAgo = months[0].start;
    const viewsByMonthAgg = await this.viewModel.aggregate([
      { $match: { viewedAt: { $gte: twelveMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$viewedAt' } }, count: { $sum: 1 } } },
    ]);
    const viewsByMonthMap = new Map(viewsByMonthAgg.map((v: any) => [v._id, v.count]));
    const monthlyViews = months.map((m) => ({
      month: m.label,
      count: viewsByMonthMap.get(`${m.start.getFullYear()}-${String(m.start.getMonth() + 1).padStart(2, '0')}`) || 0,
    }));

    const categories = await this.categoryModel.find().lean();
    const categoryMap = new Map(categories.map((c: any) => [c.slug, c]));
    const topCategories = topCategoriesAgg
      .filter((c: any) => c._id)
      .map((c: any) => ({
        slug: c._id,
        label: categoryMap.get(c._id)?.label || c._id,
        color: categoryMap.get(c._id)?.color || '#9ca3af',
        count: c.count,
        views: c.views,
      }));

    const started = completionAgg[0]?.started || 0;
    const totalCompletions = completionAgg[0]?.completed || 0;
    const averageCompletionRate = started ? Math.round((totalCompletions / started) * 100) : 0;

    return {
      totals: {
        ...typeCounts,
        ...statusCounts,
        totalViews: totals[0]?.totalViews || 0,
        totalLikes: totals[0]?.totalLikes || 0,
        totalCompletions,
        averageCompletionRate,
      },
      monthlyViews,
      mostViewed,
      topCategories,
      mostCompletedTutorials: mostCompletedTutorialsAgg,
    };
  }
}
