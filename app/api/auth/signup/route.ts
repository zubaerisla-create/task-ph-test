import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, invalidateCache } from '../../../_lib/db';
import { setSession } from '../../../_lib/auth';
import type { User, SessionUser } from '../../../_lib/types';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    invalidateCache();
    const db = await readDB();
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const initials = name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newUser: User = {
      id: generateId(),
      name,
      email,
      passwordHash: password,
      role: role ?? 'team_member',
      avatar: initials,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    await writeDB(db);

    const sessionUser: SessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
    };

    await setSession(sessionUser);
    return NextResponse.json({ user: sessionUser }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
