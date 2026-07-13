import { ApiProperty } from '@nestjs/swagger';

export class PlasticTypeItemDto {
  @ApiProperty({ example: 'PET' })
  type: string;

  @ApiProperty({ example: 42 })
  count: number;

  @ApiProperty({ example: 5200 })
  totalKg: number;

  @ApiProperty({ example: 40 })
  percentage: number;
}

export class OverviewDto {
  @ApiProperty({ example: 12480 })
  kgRecycledThisMonth: number;

  @ApiProperty({ example: 18, description: 'Percentage change vs last month' })
  kgTrend: number;

  @ApiProperty({ example: 247 })
  activeOffers: number;

  @ApiProperty({ example: 34 })
  offersThisMonth: number;

  @ApiProperty({ example: 12 })
  offersTrend: number;

  @ApiProperty({ example: 84 })
  activeBuyers: number;

  @ApiProperty({ example: 5 })
  newBuyersThisMonth: number;

  @ApiProperty({ example: 150 })
  activeSellers: number;

  @ApiProperty({ example: 30 })
  newSellersThisMonth: number;

  @ApiProperty({ example: 234 })
  totalUsers: number;

  @ApiProperty({ example: 62 })
  professionalUsers: number;

  @ApiProperty({ example: 172 })
  individualUsers: number;

  @ApiProperty({ example: 190 })
  verifiedUsers: number;

  @ApiProperty({ example: 8 })
  suspendedUsers: number;

  @ApiProperty({ example: 21 })
  newUsersThisMonth: number;

  @ApiProperty({ type: [PlasticTypeItemDto] })
  plasticTypeDistribution: PlasticTypeItemDto[];
}

export class ActivityItemDto {
  @ApiProperty({ example: 'user_registration_seller' })
  type: string;

  @ApiProperty({ example: 'Nouveau vendeur inscrit — Khaled M.' })
  title: string;

  @ApiProperty({ example: 'Sfax · Plastiques PET & HDPE' })
  sub: string;

  @ApiProperty({ example: '2026-06-23T10:30:00.000Z' })
  createdAt: Date;
}

export class ZoneItemDto {
  @ApiProperty({ example: 'Sousse' })
  zone: string;

  @ApiProperty({ example: 3846 })
  totalKg: number;

  @ApiProperty({ example: 12 })
  count: number;
}

export class MonthlyRegistrationItemDto {
  @ApiProperty({ example: 'juin' })
  month: string;

  @ApiProperty({ example: 14 })
  count: number;
}

export class PlasticDistributionItemDto {
  @ApiProperty({ example: 'PET' })
  type: string;

  @ApiProperty({ example: 42 })
  count: number;

  @ApiProperty({ example: 5200 })
  totalKg: number;

  @ApiProperty({ example: 40 })
  percentage: number;
}
