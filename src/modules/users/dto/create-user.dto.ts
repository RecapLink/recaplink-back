import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { PlasticType } from '../../../common/enums/plastic-type.enum';

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
}
