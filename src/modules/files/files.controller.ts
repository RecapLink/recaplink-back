import { Controller, Post, Delete, Param, Query, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|jpg)$/)) {
          cb(new Error('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Query('folder') folder = 'recaplink') {
    return this.filesService.uploadFile(file, folder);
  }

  @Delete(':publicId')
  async delete(@Param('publicId') publicId: string) {
    await this.filesService.deleteFile(publicId);
    return { message: 'File deleted' };
  }
}
