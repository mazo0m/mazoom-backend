import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard — populates `request.user` if a valid Bearer token
 * is present, but does NOT reject unauthenticated requests.
 *
 * Use on endpoints that behave differently for authenticated vs anonymous users
 * (e.g., public invitation page that shows extra controls to the owner).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    _err: any,
    user: TUser,
    _info: any,
    _context: ExecutionContext,
  ): TUser | null {
    // If authentication failed or no token, return null instead of throwing
    return user || null;
  }

  canActivate(context: ExecutionContext) {
    // Run the normal JWT validation, but catch and suppress errors
    return super.canActivate(context);
  }

  /**
   * Override getRequest to ensure that even if the token is missing/invalid,
   * the guard doesn't throw but just sets user to null.
   */
  handleRequestError() {
    return null;
  }
}
