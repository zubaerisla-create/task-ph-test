import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../_lib/auth';
import { proxyRequest, normalizeRole, normalizeStatus, normalizePriority, makeAvatar } from '../../../_lib/api';

function normalizeTask(t: any) {
  const assignedMember = t.assignedMember ?? t.assigneeUser ?? null;
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description ?? '',
    assignee: t.assignedMemberId ?? assignedMember?.id ?? '',
    dueDate: t.dueDate,
    priority: normalizePriority(t.priority) as any,
    status: normalizeStatus(t.status) as any,
    projectName: t.project?.name ?? t.projectName ?? '',
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

function normalizeProject(p: any) {
  const members = (p.members ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: normalizeRole(m.role),
    avatar: makeAvatar(m.name ?? ''),
    profilePicture: m.profilePicture ?? '',
  }));
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    deadline: p.deadline,
    status: normalizeStatus(p.status),
    members,
    taskCount: 0,
    completedTasks: 0,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;

    const [projectResult, tasksResult] = await Promise.all([
      proxyRequest(`/projects/${id}`),
      proxyRequest('/tasks', { searchParams: { projectId: id } }),
    ]);

    if (!projectResult.ok) {
      const data = projectResult.data as any;
      return NextResponse.json({ error: data?.message ?? 'Project not found' }, { status: projectResult.status });
    }

    const projectRaw = (projectResult.data as any)?.data ?? projectResult.data;
    const tasksRaw: any[] = (tasksResult.data as any)?.data?.data ?? (tasksResult.data as any)?.data ?? [];

    const tasks = tasksRaw.map(normalizeTask);
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const project = normalizeProject(projectRaw);

    return NextResponse.json({
      project: { ...project, tasks, taskCount: tasks.length, completedTasks: completed },
    });
  } catch (err) {
    console.error('[GET /api/projects/[id]]', err);
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
    if (session.role === 'team_member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await ctx.params;

    const updates = await req.json();
    const body: any = {};
    if (updates.name) body.name = updates.name;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.deadline) body.deadline = new Date(updates.deadline).toISOString();
    if (updates.status) body.status = updates.status.toUpperCase();
    if (updates.members) body.memberIds = updates.members;

    const result = await proxyRequest(`/projects/${id}`, { method: 'PATCH', body });
    const data = result.data as any;

    if (!result.ok) {
      return NextResponse.json({ error: data?.message ?? 'Failed to update project' }, { status: result.status });
    }

    const project = normalizeProject(data?.data ?? data);
    return NextResponse.json({ project });
  } catch (err) {
    console.error('[PATCH /api/projects/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await ctx.params;

    const result = await proxyRequest(`/projects/${id}`, { method: 'DELETE' });
    const data = result.data as any;

    if (!result.ok) {
      return NextResponse.json({ error: data?.message ?? 'Failed to delete project' }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/projects/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
