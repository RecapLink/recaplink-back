import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  private isPublic(context: ExecutionContext): boolean {
    return !!this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  canActivate(context: ExecutionContext) {
    // Always run the JWT strategy, even on @Public() routes, so req.user is
    // populated whenever a valid token is present (e.g. to know if the caller
    // is an admin). handleRequest() below decides whether a missing/invalid
    // token should actually block the request.
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: unknown, user: TUser, info: unknown, context: ExecutionContext): TUser {
    if (this.isPublic(context)) return (user ?? null) as TUser;
    if (err || !user) throw err instanceof Error ? err : new UnauthorizedException();
    return user;
  }
}
