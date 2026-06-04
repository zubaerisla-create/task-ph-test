import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '../../../_lib/auth';
import { proxyRequest } from '../../../_lib/api';

export async function POST(req: NextRequest) {
  // Call backend logout (clears backend cookies)
  await proxyRequest('/auth/logout', { method: 'POST' });
  // Clear our session cookie too
  await clearSession();
  const response = NextResponse.json({ ok: true });
  // Clear the backend access token cookie
  response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
  response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
  return response;
}
