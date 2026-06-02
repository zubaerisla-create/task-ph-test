'use client';
import { useEffect, useState } from 'react';
import {
  FolderKanban, CheckSquare, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Calendar, Flame,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { SessionUser } from '@/app/_lib/types';
import { formatDate, daysUntil, isOverdue, avatarColor } from '@/app/_lib/utils';
import Link from 'next/link';

interface KPIs {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

interface AnalyticsData {
  kpis: KPIs;
  tasksByPriority: { name: string; value: number; fill: string }[];
  tasksByStatus: { name: string; value: number; fill: string }[];
  projectProgress: { name: string; progress: number; total: number; completed: number }[];
  teamProductivity: { name: string; completed: number; pending: number }[];
  upcomingDeadlines: Array<{
    id: string; title: string; dueDate: string; priority: string;
    projectName: string;
    assigneeUser: { name: string; avatar: string } | null;
  }>;
}

interface ActivityLog {
  id: string;
  message: string;
  createdAt: string;
  type: string;
  user: { name: string; avatar: string } | null;
}

function KpiCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="surface rounded-2xl p-6 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {sub && (
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            {sub}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  );
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '12px',
};

export default function DashboardClient({ session }: { session: SessionUser }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then((r) => r.json()),
      fetch('/api/activity').then((r) => r.json()),
    ]).then(([analytics, act]) => {
      setData(analytics);
      setActivity(act.logs?.slice(0, 8) ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full spinner" />
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="gradient-text">{session.name.split(' ')[0]}</span> 👋
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Here&apos;s what&apos;s happening across your projects today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Total Projects" value={kpis?.totalProjects ?? 0} icon={FolderKanban} color="bg-violet-500" sub={`${kpis?.activeProjects ?? 0} active`} />
        <KpiCard label="Total Tasks" value={kpis?.totalTasks ?? 0} icon={CheckSquare} color="bg-blue-500" />
        <KpiCard label="Completed" value={kpis?.completedTasks ?? 0} icon={CheckCircle2} color="bg-emerald-500" />
        <KpiCard label="Pending" value={kpis?.pendingTasks ?? 0} icon={Clock} color="bg-amber-500" />
        <KpiCard label="Overdue" value={kpis?.overdueTasks ?? 0} icon={AlertTriangle} color="bg-red-500" />
        <KpiCard label="Progress" value={kpis?.totalTasks ? Math.round((kpis.completedTasks / kpis.totalTasks) * 100) : 0} icon={TrendingUp} color="bg-indigo-500" sub="%" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks by Priority */}
        <div className="surface rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Flame className="w-4 h-4 text-orange-400" /> Tasks by Priority
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data?.tasksByPriority} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {data?.tasksByPriority.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status */}
        <div className="surface rounded-2xl p-6">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data?.tasksByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {data?.tasksByStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Team Productivity */}
        <div className="surface rounded-2xl p-6">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Team Productivity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.teamProductivity} barSize={12}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
              <Bar dataKey="pending" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Progress + Activity + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress */}
        <div className="surface rounded-2xl p-6 lg:col-span-1">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Project Progress</h3>
          <div className="space-y-4">
            {data?.projectProgress.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{p.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="progress-bar h-2" style={{ width: `${p.progress}%` }} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {p.completed}/{p.total} tasks completed
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="surface rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
            <Link href="/activity" className="text-xs hover:underline" style={{ color: 'oklch(75% 0.22 264)' }}>View all</Link>
          </div>
          <div className="space-y-3">
            {activity.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(log.user?.avatar ?? 'A')}`}>
                  {log.user?.avatar ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{log.message}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="surface rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="w-4 h-4 text-violet-400" /> Upcoming Deadlines
            </h3>
          </div>
          <div className="space-y-3">
            {data?.upcomingDeadlines.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming deadlines 🎉</p>
            )}
            {data?.upcomingDeadlines.map((t) => {
              const days = daysUntil(t.dueDate);
              const urgent = days <= 3;
              return (
                <div key={t.id} className={`p-3 rounded-xl border ${urgent ? 'border-red-500/20 bg-red-500/5' : 'border-base bg-elevated'}`}>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.projectName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium ${urgent ? 'text-red-400' : ''}`} style={urgent ? {} : { color: 'var(--text-muted)' }}>
                      {days === 0 ? 'Due today!' : days === 1 ? 'Tomorrow' : `${days} days left`}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {formatDate(t.dueDate)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
