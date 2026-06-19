import { Role } from '../enums/role.enum';
import { UserStatus } from '../enums/user-status.enum';

export interface JwtPayload {
  sub: string;
  role: Role;
  status: UserStatus;
}
