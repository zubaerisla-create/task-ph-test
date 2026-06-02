import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, invalidateCache } from '../../_lib/db';
import { getSession } from '../../_lib/auth';
import type { Task, ActivityLog } from '../../_lib/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    invalidateCache();
    const db = await readDB();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') ?? '';
    const search = searchParams.get('search')?.toLowerCase() ?? '';
    const status = searchParams.get('status') ?? '';
    const priority = searchParams.get('priority') ?? '';
    const assignee = searchParams.get('assignee') ?? '';
    const sort = searchParams.get('sort') ?? 'createdAt';

    let tasks = db.tasks;

    if (session.role === 'team_member') {
      tasks = tasks.filter((t) => t.assignee === session.id);
    }
    if (projectId) tasks = tasks.filter((t) => t.projectId === projectId);
    if (search) {
      tasks = tasks.filter(
        (t) => t.title.toLowerCase().includes(search) || t.description.toLowerCase().includes(search)
      );
    }
    if (status) tasks = tasks.filter((t) => t.status === status);
    if (priority) tasks = tasks.filter((t) => t.priority === priority);
    if (assignee) tasks = tasks.filter((t) => t.assignee === assignee);

    // Sort
    tasks = [...tasks].sort((a, b) => {
      if (sort === 'dueDate') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sort === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }
      if (sort === 'updatedAt') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const enriched = tasks.map((t) => {
      const assigneeUser = db.users.find((u) => u.id === t.assignee);
      const project = db.projects.find((p) => p.id === t.projectId);
      return {
        ...t,
        assigneeUser: assigneeUser ? { id: assigneeUser.id, name: assigneeUser.name, avatar: assigneeUser.avatar } : null,
        projectName: project?.name ?? '',
      };
    });

    return NextResponse.json({ tasks: enriched });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId, title, description, assignee, dueDate, priority, status } = await req.json();
    if (!projectId || !title || !assignee || !dueDate) {
      return NextResponse.json({ error: 'projectId, title, assignee and dueDate are required' }, { status: 400 });
    }
    if (new Date(dueDate) < new Date()) {
      return NextResponse.json({ error: 'Please select a valid deadline (future date)' }, { status: 400 });
    }

    invalidateCache();
    const db = await readDB();

    // Duplicate title check within same project
    const duplicate = db.tasks.find(
      (t) => t.projectId === projectId && t.title.toLowerCase() === title.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json({ error: 'This task already exists in the project' }, { status: 409 });
    }

    // Check assignee exists
    const assigneeUser = db.users.find((u) => u.id === assignee);
    if (!assigneeUser) return NextResponse.json({ error: 'Assignee not found' }, { status: 404 });

    const task: Task = {
      id: generateId(),
      projectId,
      title,
      description: description ?? '',
      assignee,
      dueDate,
      priority: priority ?? 'medium',
      status: status ?? 'todo',
      comments: [],
      attachments: [],
      createdBy: session.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const log: ActivityLog = {
      id: generateId(),
      type: 'task_assigned',
      message: `Task "${title}" assigned to ${assigneeUser.name}`,
      userId: session.id,
      projectId,
      taskId: task.id,
      createdAt: new Date().toISOString(),
    };

    db.tasks.push(task);
    db.activityLog.unshift(log);
    await writeDB(db);

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
