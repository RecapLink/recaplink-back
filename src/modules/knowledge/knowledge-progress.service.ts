import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KnowledgeProgress, KnowledgeProgressDocument } from './schemas/knowledge-progress.schema';
import { Knowledge, KnowledgeDocument } from './schemas/knowledge.schema';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { BadgesService } from '../badges/badges.service';

@Injectable()
export class KnowledgeProgressService {
  constructor(
    @InjectModel(KnowledgeProgress.name) private readonly model: Model<KnowledgeProgressDocument>,
    @InjectModel(Knowledge.name) private readonly knowledgeModel: Model<KnowledgeDocument>,
    private readonly badgesService: BadgesService,
  ) {}

  getForUser(userId: string) {
    return this.model
      .find({ user: new Types.ObjectId(userId) })
      .populate('knowledge', 'title type slug coverImageUrl')
      .sort({ lastOpenedAt: -1 })
      .lean();
  }

  async getUserStats(userId: string) {
    const rows = await this.model
      .find({ user: new Types.ObjectId(userId) })
      .populate('knowledge', 'type')
      .lean();

    const completed = rows.filter((r) => r.status === 'completed');
    const count = (type: string) =>
      completed.filter((r: any) => r.knowledge?.type === type).length;

    return {
      articlesRead: count('article'),
      videosWatched: count('video'),
      tutorialsCompleted: count('tutorial'),
      overallProgressPercent: rows.length
        ? Math.round(rows.reduce((sum, r) => sum + r.progressPercent, 0) / rows.length)
        : 0,
    };
  }

  async upsert(userId: string, dto: UpsertProgressDto): Promise<KnowledgeProgressDocument> {
    const knowledge = await this.knowledgeModel.findById(new Types.ObjectId(dto.knowledgeId));
    if (!knowledge) throw new NotFoundException('Knowledge item not found');

    const uid = new Types.ObjectId(userId);
    const kid = new Types.ObjectId(dto.knowledgeId);
    const existing = await this.model.findOne({ user: uid, knowledge: kid });

    const update: any = { lastOpenedAt: new Date() };
    if (!existing) {
      update.startedAt = new Date();
      update.status = 'in_progress';
    }

    let completedSteps = existing?.completedSteps ?? [];
    if (dto.markStepComplete !== undefined && !completedSteps.includes(dto.markStepComplete)) {
      completedSteps = [...completedSteps, dto.markStepComplete];
      update.completedSteps = completedSteps;
    }
    if (dto.currentStep !== undefined) update.currentStep = dto.currentStep;

    if (knowledge.type === 'tutorial' && knowledge.steps?.length) {
      update.progressPercent = Math.min(100, Math.round((completedSteps.length / knowledge.steps.length) * 100));
    } else if (dto.progressPercent !== undefined) {
      update.progressPercent = dto.progressPercent;
    }

    const willComplete =
      dto.status === 'completed' ||
      (update.progressPercent !== undefined && update.progressPercent >= 100) ||
      (knowledge.type === 'tutorial' && knowledge.steps?.length && completedSteps.length >= knowledge.steps.length);

    if (willComplete) {
      update.status = 'completed';
      update.progressPercent = 100;
      update.completedAt = new Date();
    } else if (dto.status === 'in_progress') {
      update.status = 'in_progress';
    }

    const progress = await this.model.findOneAndUpdate(
      { user: uid, knowledge: kid },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (willComplete) {
      await this.checkBadgeUnlocks(userId, dto.knowledgeId);
    }

    return progress;
  }

  private async checkBadgeUnlocks(userId: string, knowledgeId: string): Promise<void> {
    const candidates = await this.badgesService.findAutoAssignableBadgesFor(knowledgeId);
    for (const badge of candidates) {
      const required = badge.requiredKnowledge || [];
      if (!required.length) continue;
      const completedCount = await this.model.countDocuments({
        user: new Types.ObjectId(userId),
        knowledge: { $in: required },
        status: 'completed',
      });
      if (completedCount >= required.length) {
        await this.badgesService.assign(badge._id.toString(), userId);
      }
    }
  }
}
