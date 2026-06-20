import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Knowledge, KnowledgeDocument } from './schemas/knowledge.schema';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';

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
  constructor(@InjectModel(Knowledge.name) private readonly model: Model<KnowledgeDocument>) {}

  async findAll(query: {
    type?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    admin?: boolean;
  }) {
    const filter: any = query.admin ? {} : { status: 'published' };
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    if (query.search) filter['title.fr'] = new RegExp(query.search, 'i');

    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('author', 'fullName avatarUrl')
        .sort({ createdAt: -1 })
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
    return item;
  }

  async create(dto: CreateKnowledgeDto, authorId: string): Promise<KnowledgeDocument> {
    const slug = dto.slug || slugify(dto.title?.fr || 'article');
    return this.model.create({ ...dto, slug, author: new Types.ObjectId(authorId) });
  }

  async update(slug: string, dto: Partial<CreateKnowledgeDto>): Promise<KnowledgeDocument> {
    return this.model.findOneAndUpdate({ slug }, dto, { new: true });
  }

  async remove(slug: string): Promise<void> {
    await this.model.deleteOne({ slug });
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

  async publish(slug: string): Promise<KnowledgeDocument> {
    return this.model.findOneAndUpdate({ slug }, { status: 'published' }, { new: true });
  }

  async archive(slug: string): Promise<KnowledgeDocument> {
    return this.model.findOneAndUpdate({ slug }, { status: 'archived' }, { new: true });
  }
}
