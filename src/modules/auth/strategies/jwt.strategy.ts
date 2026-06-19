import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../../common/types/jwt-payload.type';
import { UserStatus } from '../../../common/enums/user-status.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  validate(payload: JwtPayload) {
    if (payload.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended');
    }
    return { sub: payload.sub, role: payload.role, status: payload.status };
  }
}
