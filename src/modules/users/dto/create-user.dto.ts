import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { PlasticType } from '../../../common/enums/plastic-type.enum';
import { LegalStatus } from '../../../common/enums/legal-status.enum';
import { Language } from '../../../common/enums/language.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'username can only contain letters, numbers, underscores, dots and dashes',
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEnum(Role)
  role: Role;

  @IsEnum(LegalStatus)
  legalStatus: LegalStatus;

  @ValidateIf(o => o.legalStatus === LegalStatus.PROFESSIONNEL && !o.numeroFiscal)
  @IsNotEmpty({ message: 'registreCommerce or numeroFiscal is required for professionnel accounts' })
  @IsString()
  registreCommerce?: string;

  @ValidateIf(o => o.legalStatus === LegalStatus.PROFESSIONNEL && !o.registreCommerce)
  @IsNotEmpty({ message: 'registreCommerce or numeroFiscal is required for professionnel accounts' })
  @IsString()
  numeroFiscal?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(PlasticType, { each: true })
  plasticTypes?: PlasticType[];

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  canBuy?: boolean;

  @IsOptional()
  @IsBoolean()
  canSell?: boolean;

  @IsOptional()
  @IsEnum(Language)
  preferredLanguage?: Language;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  position?: string;
}
