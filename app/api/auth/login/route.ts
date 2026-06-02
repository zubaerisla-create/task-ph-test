import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, invalidateCache } from '../../../_lib/db';
import { setSession } from '../../../_lib/auth';
import type { User, SessionUser } from '../../../_lib/types';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const db = await readDB();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.passwordHash !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    await setSession(sessionUser);
    return NextResponse.json({ user: sessionUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
