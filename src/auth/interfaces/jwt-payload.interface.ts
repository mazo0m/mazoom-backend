import { Role } from '@prisma/client';

export interface JwtPayload {
  /** User UUID */
  sub: string;
  email: string;
  role: Role;
}
