import { NextResponse } from 'next/server';
import { readDB, invalidateCache } from '../../_lib/db';
import { getSession } from '../../_lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    invalidateCache();
    const db = await readDB();
    const now = new Date();

    const allTasks = db.tasks;
    const userTasks = session.role === 'team_member'
      ? allTasks.filter((t) => t.assignee === session.id)
      : allTasks;

    const totalProjects = session.role === 'team_member'
      ? db.projects.filter((p) => p.members.includes(session.id)).length
      : db.projects.length;
    const activeProjects = session.role === 'team_member'
      ? db.projects.filter((p) => p.members.includes(session.id) && p.status === 'active').length
      : db.projects.filter((p) => p.status === 'active').length;
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = userTasks.filter((t) => t.status !== 'completed').length;
    const overdueTasks = userTasks.filter(
      (t) => t.status !== 'completed' && new Date(t.dueDate) < now
    ).length;

    // Tasks by priority
    const tasksByPriority = [
      { name: 'High', value: userTasks.filter((t) => t.priority === 'high').length, fill: '#ef4444' },
      { name: 'Medium', value: userTasks.filter((t) => t.priority === 'medium').length, fill: '#f59e0b' },
      { name: 'Low', value: userTasks.filter((t) => t.priority === 'low').length, fill: '#10b981' },
    ];

    // Task status distribution
    const tasksByStatus = [
      { name: 'To Do', value: userTasks.filter((t) => t.status === 'todo').length, fill: '#64748b' },
      { name: 'In Progress', value: userTasks.filter((t) => t.status === 'in_progress').length, fill: '#3b82f6' },
      { name: 'Completed', value: userTasks.filter((t) => t.status === 'completed').length, fill: '#10b981' },
    ];

    // Project progress
    const projectProgress = db.projects
      .filter((p) => session.role === 'team_member' ? p.members.includes(session.id) : true)
      .map((p) => {
        const ptasks = db.tasks.filter((t) => t.projectId === p.id);
        const done = ptasks.filter((t) => t.status === 'completed').length;
        return {
          name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
          progress: ptasks.length ? Math.round((done / ptasks.length) * 100) : 0,
          total: ptasks.length,
          completed: done,
        };
      });

    // Team productivity
    const teamProductivity = db.users.map((u) => {
      const tasks = db.tasks.filter((t) => t.assignee === u.id);
      return {
        name: u.name.split(' ')[0],
        completed: tasks.filter((t) => t.status === 'completed').length,
        pending: tasks.filter((t) => t.status !== 'completed').length,
      };
    });

    // Upcoming deadlines
    const upcomingDeadlines = db.tasks
      .filter((t) => t.status !== 'completed' && new Date(t.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
      .map((t) => {
        const assigneeUser = db.users.find((u) => u.id === t.assignee);
        const project = db.projects.find((p) => p.id === t.projectId);
        return { ...t, assigneeUser: assigneeUser ? { name: assigneeUser.name, avatar: assigneeUser.avatar } : null, projectName: project?.name ?? '' };
      });

    return NextResponse.json({
      kpis: { totalProjects, activeProjects, totalTasks, completedTasks, pendingTasks, overdueTasks },
      tasksByPriority,
      tasksByStatus,
      projectProgress,
      teamProductivity,
      upcomingDeadlines,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
