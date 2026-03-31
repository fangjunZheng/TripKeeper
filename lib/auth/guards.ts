import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { getUserFromRequest, type SessionScope } from '@/lib/auth/session';

export async function requireAuth(scope: SessionScope = 'driver'): Promise<User> {
  const user = await getUserFromRequest(scope);
  if (!user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  return user;
}

export function requireAdmin(user: User): void {
  if (user.role !== Role.ADMIN) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
}

