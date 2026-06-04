import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '../../../_lib/auth';
import { normalizeRole, makeAvatar } from '../../../_lib/api';
import type { SessionUser } from '../../../_lib/types';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8321/api/v1';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Call backend login
    const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    const backendData = await backendRes.json();

    if (!backendRes.ok) {
      const msg = backendData?.message ?? backendData?.error ?? 'Invalid email or password';
      return NextResponse.json({ error: msg }, { status: backendRes.status });
    }

    // Extract tokens from backend response
    // Backend sends: { success, data: { result: { accessToken, refreshToken } } }
    const responseData = backendData?.data?.result ?? backendData?.data ?? backendData;
    const { accessToken, refreshToken } = responseData;

    if (!accessToken) {
      return NextResponse.json({ error: 'Login failed: no token received' }, { status: 500 });
    }

    // Decode the JWT payload to get user info (no verification needed — backend already verified)
    const payloadBase64 = accessToken.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));

    // Fetch full user profile from backend
    const userRes = await fetch(`${BACKEND_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Cookie: `accessToken=${accessToken}`,
      },
      cache: 'no-store',
    });

    let userName = payload.email?.split('@')[0] ?? 'User';
    let userId = payload.userId ?? payload.id;
    let profilePicture = '';

    if (userRes.ok) {
      const userData = await userRes.json();
      const user = userData.data ?? userData;
      userName = user.name ?? userName;
      userId = user.id ?? userId;
      profilePicture = user.profilePicture ?? '';
    }

    const sessionUser: SessionUser = {
      id: userId,
      name: userName,
      email: payload.email,
      role: normalizeRole(payload.role) as SessionUser['role'],
      avatar: makeAvatar(userName),
      profilePicture,
    };

    // Set both the backend accessToken cookie and our session cookie
    const response = NextResponse.json({ user: sessionUser });

    // Store backend access token so proxy routes can forward it
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: '/',
    });

    if (refreshToken) {
      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    // Also set our own session cookie (for middleware/getSession)
    await setSession(sessionUser);

    return response;
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
