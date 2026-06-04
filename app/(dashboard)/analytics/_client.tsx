'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import type { SessionUser } from '@/app/_lib/types';

const TOOLTIP = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '12px',
};

interface AnalyticsData {
  kpis: { totalProjects: number; activeProjects: number; totalTasks: number; completedTasks: number; pendingTasks: number; overdueTasks: number };
  tasksByPriority: { name: string; value: number; fill: string }[];
  tasksByStatus: { name: string; value: number; fill: string }[];
  projectProgress: { name: string; progress: number; total: number; completed: number }[];
  teamProductivity: { name: string; completed: number; pending: number }[];
}

export default function AnalyticsClient({ session }: { session: SessionUser }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics').then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full spinner" /></div>;

  const completionRate = data?.kpis.totalTasks ? Math.round((data.kpis.completedTasks / data.kpis.totalTasks) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Comprehensive insights into your team&apos;s productivity</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Projects', value: data?.kpis.totalProjects, color: 'bg-violet-500', text: 'text-violet-400' },
          { label: 'Active', value: data?.kpis.activeProjects, color: 'bg-blue-500', text: 'text-blue-400' },
          { label: 'Total Tasks', value: data?.kpis.totalTasks, color: 'bg-indigo-500', text: 'text-indigo-400' },
          { label: 'Completed', value: data?.kpis.completedTasks, color: 'bg-emerald-500', text: 'text-emerald-400' },
          { label: 'Pending', value: data?.kpis.pendingTasks, color: 'bg-amber-500', text: 'text-amber-400' },
          { label: 'Overdue', value: data?.kpis.overdueTasks, color: 'bg-red-500', text: 'text-red-400' },
        ].map(({ label, value, color, text }) => (
          <div key={label} className="surface rounded-2xl p-5 text-center">
            <div className={`w-10 h-10 ${color} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
              <div className="w-4 h-4 bg-white/30 rounded" />
            </div>
            <p className={`text-3xl font-bold ${text}`}>{value ?? 0}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Completion Meter */}
      <div className="surface rounded-2xl p-6">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Overall Completion Rate</h3>
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="oklch(58% 0.24 264)" strokeWidth="10"
                strokeDasharray={`${completionRate * 2.51} 251`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-2xl font-bold gradient-text">{completionRate}%</p>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {[
              { label: 'Completed Tasks', value: data?.kpis.completedTasks ?? 0, total: data?.kpis.totalTasks ?? 1, color: '#10b981' },
              { label: 'In Progress', value: data?.kpis.pendingTasks ?? 0, total: data?.kpis.totalTasks ?? 1, color: '#3b82f6' },
              { label: 'Overdue', value: data?.kpis.overdueTasks ?? 0, total: data?.kpis.totalTasks ?? 1, color: '#ef4444' },
            ].map(({ label, value, total, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{value}/{total}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${total ? (value / total) * 100 : 0}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Priority */}
        <div className="surface rounded-2xl p-6">
          <h3 className="font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.tasksByPriority} barSize={40}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Tasks">
                {data?.tasksByPriority?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Pie */}
        <div className="surface rounded-2xl p-6">
          <h3 className="font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data?.tasksByStatus} cx="50%" cy="45%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`} labelLine={false}>
                {data?.tasksByStatus?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Project Progress */}
        <div className="surface rounded-2xl p-6">
          <h3 className="font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Project Progress</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.projectProgress} layout="vertical" barSize={16}>
              <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP} formatter={(v) => [`${v}%`, 'Progress']} />
              <Bar dataKey="progress" radius={[0, 8, 8, 0]} fill="oklch(58% 0.24 264)" name="Progress" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Productivity */}
        <div className="surface rounded-2xl p-6">
          <h3 className="font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Team Productivity Overview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.teamProductivity} barSize={18} barGap={4}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP} />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <Bar dataKey="completed" fill="#10b981" radius={[6, 6, 0, 0]} name="Completed" />
              <Bar dataKey="pending" fill="#6366f1" radius={[6, 6, 0, 0]} name="Pending" />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
