import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, invalidateCache } from '../../../../_lib/db';
import { getSession } from '../../../../_lib/auth';
import type { Comment, ActivityLog } from '../../../../_lib/types';

export async function POST(req: NextRequest, ctx: RouteContext<'/api/tasks/[id]/comments'>) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;

    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Comment content required' }, { status: 400 });

    invalidateCache();
    const db = await readDB();
    const taskIdx = db.tasks.findIndex((t) => t.id === id);
    if (taskIdx === -1) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const comment: Comment = {
      id: generateId(),
      taskId: id,
      authorId: session.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    db.tasks[taskIdx].comments.push(comment);
    db.tasks[taskIdx].updatedAt = new Date().toISOString();

    const log: ActivityLog = {
      id: generateId(),
      type: 'comment_added',
      message: `${session.name} commented on task "${db.tasks[taskIdx].title}"`,
      userId: session.id,
      projectId: db.tasks[taskIdx].projectId,
      taskId: id,
      createdAt: new Date().toISOString(),
    };
    db.activityLog.unshift(log);
    await writeDB(db);

    const author = db.users.find((u) => u.id === session.id);
    return NextResponse.json({
      comment: { ...comment, author: author ? { id: author.id, name: author.name, avatar: author.avatar } : null },
    }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
