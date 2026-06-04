import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../_lib/auth';
import { proxyRequest, normalizeRole, normalizeStatus, normalizePriority, makeAvatar } from '../../_lib/api';

function normalizeProject(p: any) {
  const members = (p.members ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: normalizeRole(m.role),
    avatar: makeAvatar(m.name ?? ''),
    profilePicture: m.profilePicture ?? '',
  }));

  const taskCount = p.taskCount ?? p._count?.tasks ?? 0;
  const completedTasks = p.completedTasks ?? 0;

  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    deadline: p.deadline,
    status: normalizeStatus(p.status) as any,
    members,
    taskCount,
    completedTasks,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? '';

    const result = await proxyRequest('/projects', {
      searchParams: {
        ...(search ? { searchTerm: search } : {}),
        ...(status ? { status: status.toUpperCase() } : {}),
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: result.status });
    }

    const raw = result.data as any;
    const backendProjects: any[] = raw?.data?.data ?? raw?.data ?? [];

    // Enrich with task stats from dashboard
    const dashResult = await proxyRequest('/dashboard/insights');
    const dashData = dashResult.ok ? (dashResult.data as any)?.data ?? dashResult.data : null;
    const projectSummary: any[] = dashData?.projectSummary ?? [];

    const projects = backendProjects.map((p: any) => {
      const summary = projectSummary.find((s: any) => s.id === p.id);
      return normalizeProject({
        ...p,
        taskCount: summary?.totalTasks ?? 0,
        completedTasks: summary?.completedTasks ?? 0,
      });
    });

    return NextResponse.json({ projects });
  } catch (err) {
    console.error('[GET /api/projects]', err);
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

    const memberIds = members ?? [];
    if (session.id && !memberIds.includes(session.id)) {
      memberIds.push(session.id);
    }

    const result = await proxyRequest('/projects', {
      method: 'POST',
      body: {
        name,
        description: description ?? '',
        deadline: new Date(deadline).toISOString(),
        memberIds,
      },
    });

    const data = result.data as any;
    if (!result.ok) {
      const msg = data?.message ?? data?.error ?? 'Failed to create project';
      return NextResponse.json({ error: msg }, { status: result.status });
    }

    const project = data?.data ?? data;
    return NextResponse.json({ project: normalizeProject(project) }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/projects]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
