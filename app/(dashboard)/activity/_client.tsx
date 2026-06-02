'use client';
import { useEffect, useState } from 'react';
import {
  FolderKanban, CheckSquare, CheckCircle2, UserPlus, UserMinus,
  MessageSquare, RefreshCw, Activity,
} from 'lucide-react';
import type { SessionUser } from '@/app/_lib/types';
import { formatDateTime, avatarColor } from '@/app/_lib/utils';

interface Log {
  id: string; type: string; message: string; createdAt: string;
  user: { name: string; avatar: string } | null;
}

function getIcon(type: string) {
  const map: Record<string, React.ElementType> = {
    project_created: FolderKanban,
    project_updated: RefreshCw,
    project_completed: CheckCircle2,
    task_created: CheckSquare,
    task_updated: RefreshCw,
    task_assigned: CheckSquare,
    task_completed: CheckCircle2,
    task_status_changed: RefreshCw,
    member_added: UserPlus,
    member_removed: UserMinus,
    comment_added: MessageSquare,
  };
  return map[type] ?? Activity;
}

function getIconColor(type: string): string {
  if (type.includes('completed')) return 'bg-emerald-500';
  if (type.includes('created')) return 'bg-violet-500';
  if (type.includes('assigned') || type.includes('added')) return 'bg-blue-500';
  if (type.includes('removed')) return 'bg-red-500';
  if (type.includes('comment')) return 'bg-amber-500';
  return 'bg-slate-500';
}

export default function ActivityClient({ session }: { session: SessionUser }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activity').then((r) => r.json()).then((d) => { setLogs(d.logs ?? []); setLoading(false); });
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Activity Log</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Recent system activities and events</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full spinner" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No activity yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px" style={{ background: 'var(--border-color)' }} />

          <div className="space-y-2 pl-4">
            {logs.map((log, i) => {
              const Icon = getIcon(log.type);
              const iconColor = getIconColor(log.type);
              return (
                <div key={log.id} className="flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${iconColor}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 surface rounded-xl p-4 mb-2 ml-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {log.user && (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(log.user.avatar)}`}>
                            {log.user.avatar}
                          </div>
                        )}
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{log.message}</p>
                      </div>
                      <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{formatDateTime(log.createdAt)}</p>
                    </div>
                    {log.user && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>by {log.user.name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
