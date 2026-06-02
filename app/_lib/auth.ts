import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { SessionUser } from './types';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'collab-system-super-secret-key-2026'
);
const COOKIE_NAME = 'collab_session';

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return (payload as { user: SessionUser }).user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSession(user: SessionUser): Promise<void> {
  const token = await signToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
