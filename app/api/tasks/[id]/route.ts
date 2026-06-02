import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, invalidateCache } from '../../../_lib/db';
import { getSession } from '../../../_lib/auth';
import type { ActivityLog } from '../../../_lib/types';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/tasks/[id]'>) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;

    invalidateCache();
    const db = await readDB();
    const task = db.tasks.find((t) => t.id === id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const assigneeUser = db.users.find((u) => u.id === task.assignee);
    const project = db.projects.find((p) => p.id === task.projectId);
    const enrichedComments = task.comments.map((c) => {
      const author = db.users.find((u) => u.id === c.authorId);
      return { ...c, author: author ? { id: author.id, name: author.name, avatar: author.avatar } : null };
    });

    return NextResponse.json({
      task: {
        ...task,
        comments: enrichedComments,
        assigneeUser: assigneeUser ? { id: assigneeUser.id, name: assigneeUser.name, avatar: assigneeUser.avatar } : null,
        projectName: project?.name ?? '',
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/tasks/[id]'>) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;

    const updates = await req.json();

    invalidateCache();
    const db = await readDB();
    const idx = db.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const task = db.tasks[idx];

    // RBAC: team members can only update their own tasks
    if (session.role === 'team_member' && task.assignee !== session.id) {
      return NextResponse.json({ error: 'Forbidden: you can only update your own tasks' }, { status: 403 });
    }

    // Prevent reassigning completed tasks
    if (task.status === 'completed' && updates.assignee && updates.assignee !== task.assignee) {
      return NextResponse.json({ error: 'Completed tasks cannot be reassigned' }, { status: 400 });
    }

    // Prevent past due dates
    if (updates.dueDate && new Date(updates.dueDate) < new Date()) {
      return NextResponse.json({ error: 'Please select a valid deadline (future date)' }, { status: 400 });
    }

    // Duplicate title check
    if (updates.title && updates.title.toLowerCase() !== task.title.toLowerCase()) {
      const dup = db.tasks.find(
        (t) => t.id !== id && t.projectId === task.projectId && t.title.toLowerCase() === updates.title.toLowerCase()
      );
      if (dup) return NextResponse.json({ error: 'This task already exists in the project' }, { status: 409 });
    }

    const prevStatus = task.status;
    db.tasks[idx] = { ...task, ...updates, updatedAt: new Date().toISOString() };

    let logMessage = `Task "${db.tasks[idx].title}" was updated`;
    let logType: ActivityLog['type'] = 'task_updated';

    if (updates.status && updates.status !== prevStatus) {
      if (updates.status === 'completed') {
        logType = 'task_completed';
        logMessage = `Task "${db.tasks[idx].title}" marked as Completed`;
      } else {
        logType = 'task_status_changed';
        const labels: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', completed: 'Completed' };
        logMessage = `Task "${db.tasks[idx].title}" moved to ${labels[updates.status]}`;
      }
    }

    if (updates.assignee && updates.assignee !== task.assignee) {
      const newAssignee = db.users.find((u) => u.id === updates.assignee);
      logType = 'task_assigned';
      logMessage = `Task "${db.tasks[idx].title}" reassigned to ${newAssignee?.name ?? updates.assignee}`;
    }

    const log: ActivityLog = {
      id: generateId(),
      type: logType,
      message: logMessage,
      userId: session.id,
      projectId: task.projectId,
      taskId: id,
      createdAt: new Date().toISOString(),
    };
    db.activityLog.unshift(log);
    await writeDB(db);

    return NextResponse.json({ task: db.tasks[idx] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/tasks/[id]'>) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'team_member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await ctx.params;

    invalidateCache();
    const db = await readDB();
    const task = db.tasks.find((t) => t.id === id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    db.tasks = db.tasks.filter((t) => t.id !== id);

    const log: ActivityLog = {
      id: generateId(),
      type: 'task_updated',
      message: `Task "${task.title}" was deleted`,
      userId: session.id,
      projectId: task.projectId,
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
