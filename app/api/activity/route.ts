import { NextResponse } from 'next/server';
import { readDB, invalidateCache } from '../../_lib/db';
import { getSession } from '../../_lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    invalidateCache();
    const db = await readDB();

    const logs = db.activityLog
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30)
      .map((log) => {
        const user = db.users.find((u) => u.id === log.userId);
        return { ...log, user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null };
      });

    return NextResponse.json({ logs });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
