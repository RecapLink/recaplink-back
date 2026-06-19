import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findOne(filter: FilterQuery<UserDocument>): Promise<UserDocument | null> {
    return this.userModel.findOne(filter).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findMany(
    filter: FilterQuery<UserDocument>,
    skip: number,
    limit: number,
  ): Promise<[UserDocument[], number]> {
    const [data, total] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);
    return [data, total];
  }

  async updateById(
    id: string | Types.ObjectId,
    update: UpdateQuery<UserDocument>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  async deleteById(id: string | Types.ObjectId): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }
}
