import {
  Controller, Post, Delete, Param, Query,
  UploadedFile, UseInterceptors, UseGuards, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SecuritySettingsService } from '../settings/security-settings.service';

@ApiTags('Files')
@ApiBearerAuth('access-token')
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly securitySettingsService: SecuritySettingsService,
  ) {}

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
    await this.assertWithinSecurityPolicy(file);
    return this.filesService.uploadFile(file, folder);
  }

  /** Enforces the admin-configurable allowed-types/max-size policy on top of Multer's hard ceiling. */
  private async assertWithinSecurityPolicy(file: Express.Multer.File): Promise<void> {
    if (!file) return;
    const policy = await this.securitySettingsService.getPolicy();
    if (policy.allowedFileTypes?.length && !policy.allowedFileTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé (${file.mimetype}). Types acceptés : ${policy.allowedFileTypes.join(', ')}`,
      );
    }
    const maxBytes = (policy.maxUploadSizeMb || 5) * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(`Fichier trop volumineux. Taille maximale : ${policy.maxUploadSizeMb} Mo`);
    }
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

  @ApiOperation({ summary: 'Upload a video file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        video: { type: 'string', format: 'binary', description: 'Video file (mp4/webm/mov, max 100 MB)' },
      },
    },
  })
  @Post('upload-video')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^video\/(mp4|webm|quicktime)$/)) {
          return cb(new Error('Only video files are allowed (mp4/webm/mov)'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File, @Query('folder') folder = 'recaplink/knowledge/videos') {
    return this.filesService.uploadFile(file, folder);
  }

  @ApiOperation({ summary: 'Upload a PDF document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pdf: { type: 'string', format: 'binary', description: 'PDF document, max 20 MB' },
      },
    },
  })
  @Post('upload-pdf')
  @UseInterceptors(
    FileInterceptor('pdf', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new Error('Only PDF files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPdf(@UploadedFile() file: Express.Multer.File, @Query('folder') folder = 'recaplink/knowledge/docs') {
    return this.filesService.uploadFile(file, folder);
  }

  @ApiOperation({ summary: 'Delete a file by Cloudinary public_id' })
  @Delete(':publicId')
  async delete(@Param('publicId') publicId: string) {
    await this.filesService.deleteFile(publicId);
    return { message: 'File deleted' };
  }
}
