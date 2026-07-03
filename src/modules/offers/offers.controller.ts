import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, UseInterceptors,
  UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes,
  ApiBody, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { FilesService } from '../files/files.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferQueryDto } from './dto/offer-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { OfferStatus } from '../../common/enums/offer-status.enum';

@ApiTags('Offers')
@ApiBearerAuth('access-token')
@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly filesService: FilesService,
  ) {}

  @ApiOperation({ summary: 'List offers (public)' })
  @Public()
  @Get()
  findAll(@Query() query: OfferQueryDto) {
    return this.offersService.findAll(query);
  }

  @ApiOperation({ summary: 'My offers' })
  @Get('user/mine')
  myOffers(@CurrentUser('sub') userId: string) {
    return this.offersService.myOffers(userId);
  }

  @ApiOperation({ summary: 'Upload up to 5 offer images', description: 'Returns array of { url, publicId }' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Up to 5 images (jpg/jpeg/png/webp, max 5 MB each)',
        },
      },
    },
  })
  @Post('upload-images')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          return cb(new Error('Only jpg/jpeg/png/webp images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) return [];
    return Promise.all(files.map(f => this.filesService.uploadFile(f, 'recaplink/offers')));
  }

  @ApiOperation({ summary: 'Upload a voice recording', description: 'Returns { url, publicId, duration }' })
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

  @ApiOperation({ summary: 'Get offer by ID (public)' })
  @ApiParam({ name: 'id', description: 'Offer MongoDB _id' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @ApiOperation({ summary: 'Get similar offers (public)' })
  @Public()
  @Get(':id/similar')
  similar(@Param('id') id: string) {
    return this.offersService.findSimilar(id);
  }

  @ApiOperation({ summary: 'Create an offer' })
  @Post()
  create(@Body() dto: CreateOfferDto, @CurrentUser('sub') userId: string) {
    return this.offersService.create(dto, userId);
  }

  @ApiOperation({ summary: 'Update an offer' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.offersService.update(id, dto, userId, role);
  }

  @ApiOperation({ summary: 'Delete an offer' })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.offersService.remove(id, userId, role);
  }

  @ApiOperation({ summary: 'Verify / approve an offer (admin)' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/verify')
  verify(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.offersService.verify(id, adminId);
  }

  @ApiOperation({ summary: 'Update offer status — suspend, report, reactivate… (admin)' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: OfferStatus, @CurrentUser('sub') adminId: string) {
    return this.offersService.updateStatus(id, status, adminId);
  }

  @ApiOperation({ summary: 'Close an offer' })
  @Patch(':id/close')
  close(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.offersService.close(id, userId);
  }
}
