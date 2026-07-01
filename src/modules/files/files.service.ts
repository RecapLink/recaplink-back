import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  async uploadFile(
    file: Express.Multer.File,
    folder = 'recaplink',
  ): Promise<{ url: string; publicId: string }> {
    if (!file) throw new BadRequestException('No file provided');

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const dir = path.join(this.uploadsDir, folder);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), file.buffer);

    const publicId = `${folder}/${filename}`;
    const url = `/api/uploads/${folder}/${filename}`;

    return { url, publicId };
  }

  async uploadVoice(
    file: Express.Multer.File,
    folder = 'recaplink/voice',
  ): Promise<{ url: string; publicId: string; duration: number }> {
    if (!file) throw new BadRequestException('No file provided');

    const ext = path.extname(file.originalname).toLowerCase() || '.webm';
    const filename = `${randomUUID()}${ext}`;
    const dir = path.join(this.uploadsDir, folder);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), file.buffer);

    const publicId = `${folder}/${filename}`;
    const url = `/api/uploads/${folder}/${filename}`;

    return { url, publicId, duration: 0 };
  }

  async deleteFile(publicId: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, publicId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
