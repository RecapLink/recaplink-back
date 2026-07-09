import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LearningPath, LearningPathDocument } from './schemas/learning-path.schema';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { KnowledgeProgressService } from '../knowledge/knowledge-progress.service';
import { NotificationsService } from '../notifications/notifications.service';

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
export class LearningPathsService {
  constructor(
    @InjectModel(LearningPath.name) private readonly model: Model<LearningPathDocument>,
    private readonly progressService: KnowledgeProgressService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(admin: boolean) {
    const filter = admin ? {} : { status: 'published' };
    return this.model
      .find(filter)
      .populate('items.knowledge', 'title type slug coverImageUrl')
      .populate('badge', 'name iconUrl')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findBySlug(slug: string, userId?: string): Promise<Record<string, any>> {
    const path = await this.model
      .findOne({ slug })
      .populate('items.knowledge', 'title type slug coverImageUrl')
      .populate('badge', 'name iconUrl')
      .lean();
    if (!path) throw new NotFoundException('Learning path not found');

    if (!userId) return path;

    const progress = await this.progressService.getForUser(userId);
    const completedIds = new Set(
      progress
        .filter((p: any) => p.status === 'completed')
        .map((p: any) => p.knowledge?._id?.toString()),
    );
    const completedCount = path.items.filter((i: any) =>
      completedIds.has(i.knowledge?._id?.toString()),
    ).length;
    const completionPercent = path.items.length
      ? Math.round((completedCount / path.items.length) * 100)
      : 0;

    return { ...path, completionPercent };
  }

  async create(dto: CreateLearningPathDto, adminId: string): Promise<LearningPathDocument> {
    const slug = dto.slug || slugify(dto.title?.fr || 'parcours');
    const path = await this.model.create({
      ...dto,
      slug,
      badge: dto.badge ? new Types.ObjectId(dto.badge) : undefined,
      items: dto.items?.map((i) => ({ knowledge: new Types.ObjectId(i.knowledge), order: i.order ?? 0 })),
    });

    await this.notificationsService.notifyAdmins({
      type: 'learning_path_created',
      title: 'Nouveau parcours',
      message: `${path.title?.fr || slug} a été créé`,
      link: '/admin/knowledge',
      createdBy: adminId,
      metadata: { slug },
    });

    return path;
  }

  async update(id: string, dto: Partial<CreateLearningPathDto>, adminId: string): Promise<LearningPathDocument> {
    const update: any = { ...dto };
    if (dto.badge) update.badge = new Types.ObjectId(dto.badge);
    if (dto.items) update.items = dto.items.map((i) => ({ knowledge: new Types.ObjectId(i.knowledge), order: i.order ?? 0 }));

    const path = await this.model.findByIdAndUpdate(new Types.ObjectId(id), update, { new: true });
    if (!path) throw new NotFoundException('Learning path not found');

    await this.notificationsService.notifyAdmins({
      type: 'learning_path_updated',
      title: 'Parcours modifié',
      message: `${path.title?.fr || path.slug} a été mis à jour`,
      link: '/admin/knowledge',
      createdBy: adminId,
      metadata: { slug: path.slug },
    });

    return path;
  }

  async remove(id: string, adminId: string): Promise<void> {
    const path = await this.model.findById(new Types.ObjectId(id));
    await this.model.deleteOne({ _id: new Types.ObjectId(id) });

    await this.notificationsService.notifyAdmins({
      type: 'learning_path_deleted',
      title: 'Parcours supprimé',
      message: `${path?.title?.fr || 'Parcours'} a été supprimé`,
      createdBy: adminId,
      metadata: { id },
    });
  }
}
