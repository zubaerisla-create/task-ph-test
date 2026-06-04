import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8321/api/v1';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/auth/signup-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        role: (body.role ?? 'team_member').toUpperCase(),
      }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.message ?? 'Failed to send OTP' }, { status: res.status });
    }

    return NextResponse.json({ success: true, message: data.message });
  } catch (err) {
    console.error('[signup-otp]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
