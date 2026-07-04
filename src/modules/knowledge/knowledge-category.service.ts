import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KnowledgeCategory, KnowledgeCategoryDocument } from './schemas/knowledge-category.schema';
import { CreateKnowledgeCategoryDto, UpdateKnowledgeCategoryDto } from './dto/create-knowledge-category.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

@Injectable()
export class KnowledgeCategoryService {
  constructor(
    @InjectModel(KnowledgeCategory.name) private readonly model: Model<KnowledgeCategoryDocument>,
  ) {}

  findAll() {
    return this.model.find().sort({ label: 1 }).lean();
  }

  async create(dto: CreateKnowledgeCategoryDto): Promise<KnowledgeCategoryDocument> {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.label);
    const existing = await this.model.findOne({ slug });
    if (existing) throw new ConflictException('A category with this slug already exists');
    return this.model.create({ label: dto.label, slug, color: dto.color || '#4d9538' });
  }

  async update(id: string, dto: UpdateKnowledgeCategoryDto): Promise<KnowledgeCategoryDocument> {
    const update: Partial<KnowledgeCategory> = {};
    if (dto.label !== undefined) update.label = dto.label;
    if (dto.color !== undefined) update.color = dto.color;
    if (dto.slug !== undefined) update.slug = slugify(dto.slug);
    const item = await this.model.findByIdAndUpdate(id, update, { new: true });
    if (!item) throw new NotFoundException('Category not found');
    return item;
  }

  async remove(id: string): Promise<void> {
    const res = await this.model.deleteOne({ _id: id });
    if (res.deletedCount === 0) throw new NotFoundException('Category not found');
  }
}
