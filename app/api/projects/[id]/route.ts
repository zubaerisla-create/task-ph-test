import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, invalidateCache } from '../../../_lib/db';
import { getSession } from '../../../_lib/auth';
import type { ActivityLog } from '../../../_lib/types';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/projects/[id]'>) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;

    invalidateCache();
    const db = await readDB();
    const project = db.projects.find((p) => p.id === id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const tasks = db.tasks.filter((t) => t.projectId === id).map((t) => {
      const assigneeUser = db.users.find((u) => u.id === t.assignee);
      return { ...t, assigneeUser: assigneeUser ? { id: assigneeUser.id, name: assigneeUser.name, avatar: assigneeUser.avatar } : null };
    });
    const members = db.users.filter((u) => project.members.includes(u.id)).map((u) => ({
      id: u.id, name: u.name, avatar: u.avatar, role: u.role, email: u.email,
    }));
    const completed = tasks.filter((t) => t.status === 'completed').length;

    return NextResponse.json({ project: { ...project, tasks, members, taskCount: tasks.length, completedTasks: completed } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/projects/[id]'>) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'team_member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await ctx.params;

    const updates = await req.json();
    if (updates.deadline && new Date(updates.deadline) < new Date()) {
      return NextResponse.json({ error: 'Please select a valid deadline (future date)' }, { status: 400 });
    }

    invalidateCache();
    const db = await readDB();
    const idx = db.projects.findIndex((p) => p.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    db.projects[idx] = { ...db.projects[idx], ...updates, updatedAt: new Date().toISOString() };

    const log: ActivityLog = {
      id: generateId(),
      type: 'project_updated',
      message: `Project "${db.projects[idx].name}" was updated`,
      userId: session.id,
      projectId: id,
      createdAt: new Date().toISOString(),
    };
    db.activityLog.unshift(log);
    await writeDB(db);

    return NextResponse.json({ project: db.projects[idx] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/projects/[id]'>) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await ctx.params;

    invalidateCache();
    const db = await readDB();
    const project = db.projects.find((p) => p.id === id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    db.projects = db.projects.filter((p) => p.id !== id);
    db.tasks = db.tasks.filter((t) => t.projectId !== id);

    const log: ActivityLog = {
      id: generateId(),
      type: 'project_updated',
      message: `Project "${project.name}" was deleted`,
      userId: session.id,
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
