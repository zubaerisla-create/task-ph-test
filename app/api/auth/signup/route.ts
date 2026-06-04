import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '../../../_lib/auth';
import { normalizeRole, makeAvatar } from '../../../_lib/api';
import type { SessionUser } from '../../../_lib/types';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8321/api/v1';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // 1. Call backend to create the user
    const createRes = await fetch(`${BACKEND_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        role: (role ?? 'team_member').toUpperCase(),
      }),
      cache: 'no-store',
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
      const msg = createData?.message ?? createData?.error ?? 'Registration failed';
      return NextResponse.json({ error: msg }, { status: createRes.status });
    }

    // 2. Call backend to log in
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      const msg = loginData?.message ?? loginData?.error ?? 'Login failed after registration';
      return NextResponse.json({ error: msg }, { status: loginRes.status });
    }

    // Extract tokens
    const responseData = loginData?.data?.result ?? loginData?.data ?? loginData;
    const { accessToken, refreshToken } = responseData;

    if (!accessToken) {
      return NextResponse.json({ error: 'Login failed: no token received' }, { status: 500 });
    }

    // Decode JWT payload
    const payloadBase64 = accessToken.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));

    const sessionUser: SessionUser = {
      id: payload.userId ?? payload.id,
      name,
      email: payload.email,
      role: normalizeRole(payload.role) as SessionUser['role'],
      avatar: makeAvatar(name),
    };

    const response = NextResponse.json({ user: sessionUser }, { status: 201 });

    // Store backend access token
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

    // Also set our session cookie
    await setSession(sessionUser);

    return response;
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

