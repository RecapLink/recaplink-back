import { Role } from '../enums/role.enum';
import { UserStatus } from '../enums/user-status.enum';

export interface JwtPayload {
  sub: string;
  role: Role;
  status: UserStatus;
  /** Session _id this access token was minted alongside — lets logout/session views target the right Session doc. */
  sid?: string;
}
