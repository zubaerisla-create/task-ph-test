import { NextResponse } from 'next/server';
import { getSession } from '../../_lib/auth';
import { proxyRequest } from '../../_lib/api';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await proxyRequest('/dashboard/insights');
    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: result.status });
    }

    const raw = (result.data as any)?.data ?? result.data;

    const kpi = raw?.kpi ?? {};
    const projectSummary: any[] = raw?.projectSummary ?? [];
    const tasksByPriority = raw?.tasksByPriority ?? { HIGH: 0, MEDIUM: 0, LOW: 0 };
    const taskStatusDistribution = raw?.taskStatusDistribution ?? { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    const memberWorkload: any[] = raw?.memberWorkloadSummary ?? [];
    const upcomingDeadlines: any[] = raw?.upcomingDeadlines ?? [];

    return NextResponse.json({
      kpis: {
        totalProjects: kpi.totalProjects ?? 0,
        activeProjects: projectSummary.filter((p: any) => p.status === 'ACTIVE').length,
        totalTasks: kpi.totalTasks ?? 0,
        completedTasks: kpi.completedTasks ?? 0,
        pendingTasks: kpi.pendingTasks ?? 0,
        overdueTasks: kpi.overdueTasks ?? 0,
      },
      tasksByPriority: [
        { name: 'High', value: tasksByPriority.HIGH ?? 0, fill: '#ef4444' },
        { name: 'Medium', value: tasksByPriority.MEDIUM ?? 0, fill: '#f59e0b' },
        { name: 'Low', value: tasksByPriority.LOW ?? 0, fill: '#10b981' },
      ],
      tasksByStatus: [
        { name: 'To Do', value: taskStatusDistribution.TODO ?? 0, fill: '#64748b' },
        { name: 'In Progress', value: taskStatusDistribution.IN_PROGRESS ?? 0, fill: '#3b82f6' },
        { name: 'Completed', value: taskStatusDistribution.COMPLETED ?? 0, fill: '#10b981' },
      ],
      projectProgress: projectSummary.map((p: any) => ({
        name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
        progress: p.progressPercentage ?? 0,
        total: p.totalTasks ?? 0,
        completed: p.completedTasks ?? 0,
      })),
      teamProductivity: memberWorkload.map((m: any) => ({
        name: (m.name ?? '').split(' ')[0],
        completed: m.completedTasks ?? 0,
        pending: m.pendingTasks ?? 0,
      })),
      upcomingDeadlines: upcomingDeadlines.map((t: any) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        priority: (t.priority ?? 'MEDIUM').toLowerCase(),
        projectName: t.project?.name ?? '',
        assigneeUser: null,
      })),
    });
  } catch (err) {
    console.error('[GET /api/analytics]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
