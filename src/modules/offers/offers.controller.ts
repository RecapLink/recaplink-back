import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferQueryDto } from './dto/offer-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Public()
  @Get()
  findAll(@Query() query: OfferQueryDto) {
    return this.offersService.findAll(query);
  }

  @Get('user/mine')
  myOffers(@CurrentUser('sub') userId: string) {
    return this.offersService.myOffers(userId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @Public()
  @Get(':id/similar')
  similar(@Param('id') id: string) {
    return this.offersService.findSimilar(id);
  }

  @Post()
  create(@Body() dto: CreateOfferDto, @CurrentUser('sub') userId: string) {
    return this.offersService.create(dto, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.offersService.update(id, dto, userId, role);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.offersService.remove(id, userId, role);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/verify')
  verify(@Param('id') id: string) {
    return this.offersService.verify(id);
  }

  @Patch(':id/close')
  close(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.offersService.close(id, userId);
  }
}
