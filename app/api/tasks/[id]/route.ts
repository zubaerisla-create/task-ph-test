import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../_lib/auth';
import { proxyRequest, normalizeStatus, normalizePriority, makeAvatar } from '../../../_lib/api';

function normalizeTask(t: any) {
  const assignedMember = t.assignedMember ?? null;
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description ?? '',
    assignee: t.assignedMemberId ?? assignedMember?.id ?? '',
    dueDate: t.dueDate,
    priority: normalizePriority(t.priority) as any,
    status: normalizeStatus(t.status) as any,
    projectName: t.project?.name ?? '',
    assigneeUser: assignedMember
      ? {
          id: assignedMember.id,
          name: assignedMember.name,
          avatar: makeAvatar(assignedMember.name ?? ''),
          profilePicture: assignedMember.profilePicture ?? '',
        }
      : null,
    comments: [],
    attachments: [],
    createdBy: '',
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;

    const result = await proxyRequest(`/tasks/${id}`);
    if (!result.ok) {
      const data = result.data as any;
      return NextResponse.json({ error: data?.message ?? 'Task not found' }, { status: result.status });
    }

    const raw = (result.data as any)?.data ?? result.data;
    return NextResponse.json({ task: normalizeTask(raw) });
  } catch (err) {
    console.error('[GET /api/tasks/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return PATCH(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;

    const updates = await req.json();
    const body: any = {};

    if (updates.title !== undefined) body.title = updates.title;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.dueDate !== undefined) body.dueDate = new Date(updates.dueDate).toISOString();
    if (updates.priority !== undefined) body.priority = updates.priority.toUpperCase();
    if (updates.status !== undefined) body.status = updates.status.toUpperCase();
    if (updates.assignee !== undefined) {
      body.assignedMemberId = updates.assignee || null;
    }

    const result = await proxyRequest(`/tasks/${id}`, { method: 'PATCH', body });
    const data = result.data as any;

    if (!result.ok) {
      return NextResponse.json({ error: data?.message ?? 'Failed to update task' }, { status: result.status });
    }

    const task = normalizeTask(data?.data ?? data);
    return NextResponse.json({ task });
  } catch (err) {
    console.error('[PATCH /api/tasks/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'team_member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await ctx.params;

    const result = await proxyRequest(`/tasks/${id}`, { method: 'DELETE' });
    const data = result.data as any;

    if (!result.ok) {
      return NextResponse.json({ error: data?.message ?? 'Failed to delete task' }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tasks/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
