import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, invalidateCache } from '../../_lib/db';
import { getSession } from '../../_lib/auth';
import type { User, ActivityLog } from '../../_lib/types';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    invalidateCache();
    const db = await readDB();

    const users = db.users.map((u) => {
      const tasks = db.tasks.filter((t) => t.assignee === u.id);
      const completed = tasks.filter((t) => t.status === 'completed').length;
      const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
      const todo = tasks.filter((t) => t.status === 'todo').length;
      const overdue = tasks.filter(
        (t) => t.status !== 'completed' && new Date(t.dueDate) < new Date()
      ).length;
      const projects = db.projects.filter((p) => p.members.includes(u.id));

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        taskCount: tasks.length,
        completedTasks: completed,
        inProgressTasks: inProgress,
        todoTasks: todo,
        overdueTasks: overdue,
        projectCount: projects.length,
      };
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: only admins can create team members' }, { status: 403 });
    }

    const { name, email, password, role } = await req.json();
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields (name, email, password, role) are required' }, { status: 400 });
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
      role,
      avatar: initials || 'US',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    // Create an activity log
    const log: ActivityLog = {
      id: generateId(),
      type: 'member_added',
      message: `Admin ${session.name} created new team member "${name}" (${role})`,
      userId: session.id,
      createdAt: new Date().toISOString(),
    };
    db.activityLog.unshift(log);

    await writeDB(db);

    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
      }
    }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

