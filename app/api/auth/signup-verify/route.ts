import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '../../../_lib/auth';
import { normalizeRole, makeAvatar } from '../../../_lib/api';
import type { SessionUser } from '../../../_lib/types';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8321/api/v1';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/auth/signup-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.message ?? 'Verification failed' }, { status: res.status });
    }

    // Extract tokens and user info from backend response
    // Backend sends: { success, data: { user, accessToken, refreshToken } }
    const responseData = data?.data ?? data;
    const { accessToken, refreshToken, user } = responseData;

    if (!accessToken || !user) {
      return NextResponse.json({ error: 'Verification succeeded but login failed' }, { status: 500 });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role) as SessionUser['role'],
      avatar: makeAvatar(user.name ?? ''),
      profilePicture: user.profilePicture ?? '',
    };

    const response = NextResponse.json({ user: sessionUser }, { status: 201 });

    // Store cookies
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

    // Set collab_session session cookie
    await setSession(sessionUser);

    return response;
  } catch (err) {
    console.error('[signup-verify]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
