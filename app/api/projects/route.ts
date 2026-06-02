import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, invalidateCache } from '../../_lib/db';
import { getSession } from '../../_lib/auth';
import type { Project, ActivityLog } from '../../_lib/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    invalidateCache();
    const db = await readDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() ?? '';
    const status = searchParams.get('status') ?? '';

    let projects = db.projects;

    // Non-admins only see projects they are members of
    if (session.role === 'team_member') {
      projects = projects.filter((p) => p.members.includes(session.id));
    }
    if (search) {
      projects = projects.filter(
        (p) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
      );
    }
    if (status) {
      projects = projects.filter((p) => p.status === status);
    }

    // Enrich with task stats
    const enriched = projects.map((p) => {
      const tasks = db.tasks.filter((t) => t.projectId === p.id);
      const completed = tasks.filter((t) => t.status === 'completed').length;
      const members = db.users.filter((u) => p.members.includes(u.id)).map((u) => ({
        id: u.id, name: u.name, avatar: u.avatar, role: u.role,
      }));
      return { ...p, taskCount: tasks.length, completedTasks: completed, members };
    });

    return NextResponse.json({ projects: enriched });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'team_member') {
      return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 });
    }

    const { name, description, deadline, status, members } = await req.json();
    if (!name || !deadline) {
      return NextResponse.json({ error: 'Name and deadline are required' }, { status: 400 });
    }
    if (new Date(deadline) < new Date()) {
      return NextResponse.json({ error: 'Please select a valid deadline (future date)' }, { status: 400 });
    }

    invalidateCache();
    const db = await readDB();

    const existing = db.projects.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'A project with this name already exists' }, { status: 409 });
    }

    const project: Project = {
      id: generateId(),
      name,
      description: description ?? '',
      deadline,
      status: status ?? 'active',
      createdBy: session.id,
      members: members ?? [session.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const log: ActivityLog = {
      id: generateId(),
      type: 'project_created',
      message: `Project "${name}" was created`,
      userId: session.id,
      projectId: project.id,
      createdAt: new Date().toISOString(),
    };

    db.projects.push(project);
    db.activityLog.unshift(log);
    await writeDB(db);

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
