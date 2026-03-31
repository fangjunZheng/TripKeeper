import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';
import { prisma } from '@/lib/db/client';

export type SessionScope = 'driver' | 'admin';

const DRIVER_SESSION_COOKIE_NAME = 'driver_session';
const ADMIN_SESSION_COOKIE_NAME = 'admin_session';

function getCookieName(scope: SessionScope): string {
  return scope === 'admin' ? ADMIN_SESSION_COOKIE_NAME : DRIVER_SESSION_COOKIE_NAME;
}

type JwtPayload = {
  sub: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return secret;
}

export async function createSession(
  user: User,
  scope: SessionScope = 'driver',
): Promise<void> {
  const token = jwt.sign(
    {
      sub: user.id,
    } as JwtPayload,
    getJwtSecret(),
    {
      expiresIn: '7d',
    },
  );

  (await cookies()).set(getCookieName(scope), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession(scope: SessionScope = 'driver'): Promise<void> {
  (await cookies()).delete(getCookieName(scope));
}

export async function getUserFromRequest(
  scope: SessionScope = 'driver',
): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCookieName(scope))?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (!decoded.sub) return null;

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    return user;
  } catch {
    return null;
  }
}

