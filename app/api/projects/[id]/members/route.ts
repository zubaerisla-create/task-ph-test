import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, invalidateCache } from '../../../../_lib/db';
import { getSession } from '../../../../_lib/auth';
import type { ActivityLog } from '../../../../_lib/types';

export async function POST(req: NextRequest, ctx: RouteContext<'/api/projects/[id]/members'>) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'team_member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await ctx.params;

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    invalidateCache();
    const db = await readDB();
    const projectIdx = db.projects.findIndex((p) => p.id === id);
    if (projectIdx === -1) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const user = db.users.find((u) => u.id === userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!db.projects[projectIdx].members.includes(userId)) {
      db.projects[projectIdx].members.push(userId);
      db.projects[projectIdx].updatedAt = new Date().toISOString();

      const log: ActivityLog = {
        id: generateId(),
        type: 'member_added',
        message: `${user.name} added to project "${db.projects[projectIdx].name}"`,
        userId: session.id,
        projectId: id,
        createdAt: new Date().toISOString(),
      };
      db.activityLog.unshift(log);
      await writeDB(db);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/projects/[id]/members'>) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'team_member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await ctx.params;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    invalidateCache();
    const db = await readDB();
    const projectIdx = db.projects.findIndex((p) => p.id === id);
    if (projectIdx === -1) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const user = db.users.find((u) => u.id === userId);
    db.projects[projectIdx].members = db.projects[projectIdx].members.filter((m) => m !== userId);
    db.projects[projectIdx].updatedAt = new Date().toISOString();

    const log: ActivityLog = {
      id: generateId(),
      type: 'member_removed',
      message: `${user?.name ?? userId} removed from project "${db.projects[projectIdx].name}"`,
      userId: session.id,
      projectId: id,
      createdAt: new Date().toISOString(),
    };
    db.activityLog.unshift(log);
    await writeDB(db);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
