import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../_lib/auth';
import { proxyRequest, normalizeStatus, normalizePriority, makeAvatar } from '../../_lib/api';

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

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? '';
    const priority = searchParams.get('priority') ?? '';
    const projectId = searchParams.get('projectId') ?? '';
    const assignee = searchParams.get('assignee') ?? '';
    const sort = searchParams.get('sort') ?? 'createdAt';

    const params: Record<string, string> = {};
    if (search) params.searchTerm = search;
    if (status) params.status = status.toUpperCase();
    if (priority) params.priority = priority.toUpperCase();
    if (projectId) params.projectId = projectId;
    if (assignee) params.assignedMemberId = assignee;
    if (sort === 'dueDate') params.sortBy = 'dueDate';
    else if (sort === 'updatedAt') params.sortBy = 'updatedAt';

    const result = await proxyRequest('/tasks', { searchParams: params });

    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: result.status });
    }

    const raw = result.data as any;
    const backendTasks: any[] = raw?.data?.data ?? raw?.data ?? [];

    const tasks = backendTasks.map(normalizeTask);

    // Client-side sort for priority (backend might not support it)
    if (sort === 'priority') {
      const order = { high: 0, medium: 1, low: 2 } as Record<string, number>;
      tasks.sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
    }

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('[GET /api/tasks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId, title, description, assignee, dueDate, priority, status } = await req.json();
    if (!projectId || !title || !dueDate) {
      return NextResponse.json({ error: 'projectId, title and dueDate are required' }, { status: 400 });
    }

    const result = await proxyRequest('/tasks', {
      method: 'POST',
      body: {
        title,
        description: description ?? '',
        dueDate: new Date(dueDate).toISOString(),
        priority: priority ? priority.toUpperCase() : 'MEDIUM',
        projectId,
        assignedMemberId: assignee || undefined,
      },
    });

    const data = result.data as any;
    if (!result.ok) {
      const msg = data?.message ?? data?.error ?? 'Failed to create task';
      return NextResponse.json({ error: msg }, { status: result.status });
    }

    const task = normalizeTask(data?.data ?? data);
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tasks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
