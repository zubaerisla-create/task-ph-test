import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../_lib/auth';
import { proxyRequest, normalizeRole, makeAvatar } from '../../_lib/api';

// Normalize backend user to frontend shape
function normalizeUser(u: any) {
  const avatar = makeAvatar(u.name ?? '');
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: normalizeRole(u.role),
    avatar,
    profilePicture: u.profilePicture ?? '',
    taskCount: u.taskCount ?? 0,
    completedTasks: u.completedTasks ?? 0,
    inProgressTasks: u.inProgressTasks ?? 0,
    todoTasks: u.todoTasks ?? 0,
    overdueTasks: u.overdueTasks ?? 0,
    projectCount: u.projectCount ?? 0,
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all users from backend
    const result = await proxyRequest('/users');
    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: result.status });
    }

    const raw = result.data as any;
    const backendUsers: any[] = raw?.data?.data ?? raw?.data ?? raw?.users ?? [];

    // Enrich with workload from dashboard
    const dashResult = await proxyRequest('/dashboard/insights');
    const dashData = dashResult.ok ? (dashResult.data as any)?.data ?? dashResult.data : null;
    const memberWorkload: any[] = dashData?.memberWorkloadSummary ?? [];

    const users = backendUsers.map((u: any) => {
      const workload = memberWorkload.find((m: any) => m.id === u.id);
      return normalizeUser({
        ...u,
        taskCount: workload?.totalTasks ?? 0,
        completedTasks: workload?.completedTasks ?? 0,
        inProgressTasks: workload?.pendingTasks ?? 0,
        todoTasks: workload?.todoTasks ?? 0,
        overdueTasks: 0,
        projectCount: u.projectIds?.length ?? 0,
      });
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error('[GET /api/team]', err);
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

    const result = await proxyRequest('/users', {
      method: 'POST',
      body: {
        name,
        email,
        password,
        role: role.toUpperCase(),
      },
    });

    const data = result.data as any;
    if (!result.ok) {
      const msg = data?.message ?? data?.error ?? 'Failed to create user';
      return NextResponse.json({ error: msg }, { status: result.status });
    }

    const user = data?.data ?? data;
    return NextResponse.json({ user: normalizeUser(user) }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/team]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
