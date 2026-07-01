import {
  Controller, Post, Delete, Param, Query,
  UploadedFile, UseInterceptors, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Files')
@ApiBearerAuth('access-token')
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiOperation({ summary: 'Upload a single image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|jpg)$/)) {
          cb(new Error('Only image files are allowed (jpg/jpeg/png/webp)'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Query('folder') folder = 'recaplink') {
    return this.filesService.uploadFile(file, folder);
  }

  @ApiOperation({ summary: 'Upload a voice recording' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        voice: {
          type: 'string',
          format: 'binary',
          description: 'Audio file (mp3/wav/m4a/webm, max 50 MB)',
        },
      },
    },
  })
  @Post('upload-voice')
  @UseInterceptors(
    FileInterceptor('voice', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^(audio\/(mpeg|wav|x-m4a|mp4|ogg|webm)|video\/webm)$/)) {
          return cb(new Error('Only audio files (mp3/wav/m4a/webm) are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadVoice(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadVoice(file);
  }

  @ApiOperation({ summary: 'Delete a file by Cloudinary public_id' })
  @Delete(':publicId')
  async delete(@Param('publicId') publicId: string) {
    await this.filesService.deleteFile(publicId);
    return { message: 'File deleted' };
  }
}
