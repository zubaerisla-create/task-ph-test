'use client';
import { useEffect, useState } from 'react';
import { Search, Users, CheckCircle2, Clock, AlertTriangle, FolderKanban, Plus, X } from 'lucide-react';
import type { SessionUser, Role } from '@/app/_lib/types';
import { avatarColor, roleLabel } from '@/app/_lib/utils';

interface TeamMember {
  id: string; name: string; email: string; role: Role; avatar: string;
  taskCount: number; completedTasks: number; inProgressTasks: number;
  todoTasks: number; overdueTasks: number; projectCount: number;
  profilePicture?: string;
}

interface CreateModalProps {
  onClose: () => void;
  onSaved: () => void;
  members: TeamMember[];
}

function CreateMemberModal({ onClose, onSaved, members }: CreateModalProps) {
  const [mode, setMode] = useState<'create' | 'update_role'>('create');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'team_member' as Role });
  const [updateForm, setUpdateForm] = useState({ userId: '', role: 'team_member' as Role });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'create') {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        setError(data.error ?? 'Failed to create team member');
        setLoading(false);
      }
    } else {
      if (!updateForm.userId) {
        setError('Please select a member');
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/team/${updateForm.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: updateForm.role }),
      });
      const data = await res.json();
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        setError(data.error ?? 'Failed to update user role');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div className="w-full max-w-md glass rounded-2xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Manage Team Roles</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg btn-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-base mb-5">
          <button
            type="button"
            onClick={() => { setMode('create'); setError(''); }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
              mode === 'create'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-muted hover:text-secondary'
            }`}
          >
            Create New Member
          </button>
          <button
            type="button"
            onClick={() => { setMode('update_role'); setError(''); }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
              mode === 'update_role'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-muted hover:text-secondary'
            }`}
          >
            Update Role
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl input-base text-sm" placeholder="E.g. Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl input-base text-sm" placeholder="E.g. jane@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password *</label>
                <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl input-base text-sm" placeholder="Minimum 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Role *</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="w-full px-4 py-2.5 rounded-xl input-base text-sm">
                  <option value="team_member">Team Member</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Select Team Member *</label>
                <select required value={updateForm.userId} onChange={(e) => {
                  const uid = e.target.value;
                  const member = members.find(m => m.id === uid);
                  setUpdateForm((f) => ({ ...f, userId: uid, role: member ? member.role : 'team_member' }));
                }}
                  className="w-full px-4 py-2.5 rounded-xl input-base text-sm">
                  <option value="">Choose a member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Role *</label>
                <select value={updateForm.role} onChange={(e) => setUpdateForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="w-full px-4 py-2.5 rounded-xl input-base text-sm">
                  <option value="team_member">Team Member</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-400 bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl btn-secondary text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl btn-primary text-sm font-medium flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" /> : mode === 'create' ? 'Create Member' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeamClient({ session }: { session: SessionUser }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchMembers = () => {
    setLoading(true);
    fetch('/api/team').then((r) => r.json()).then((d) => { setMembers(d.users ?? []); setLoading(false); });
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filtered = members.filter((m) =>
    (!search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || m.role === roleFilter)
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Team</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{members.length} team members</p>
        </div>
        {session.role === 'admin' && (
          <button
            id="add-team-member-btn"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Add Team Member
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..." className="w-full pl-10 pr-4 py-2.5 rounded-xl input-base text-sm" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2.5 rounded-xl input-base text-sm min-w-[160px]">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
          <option value="team_member">Team Member</option>
        </select>
      </div>

      {/* Workload Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-2">
        {[
          { label: 'Total Members', value: members.length, icon: Users, color: 'bg-violet-500' },
          { label: 'Total Tasks Assigned', value: members.reduce((s, m) => s + m.taskCount, 0), icon: CheckCircle2, color: 'bg-blue-500' },
          { label: 'Tasks Completed', value: members.reduce((s, m) => s + m.completedTasks, 0), icon: CheckCircle2, color: 'bg-emerald-500' },
          { label: 'Overdue Tasks', value: members.reduce((s, m) => s + m.overdueTasks, 0), icon: AlertTriangle, color: 'bg-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="surface rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Member Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full spinner" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((m) => {
            const pct = m.taskCount ? Math.round((m.completedTasks / m.taskCount) * 100) : 0;
            const isMe = m.id === session.id;
            return (
              <div key={m.id} className={`surface rounded-2xl p-6 card-hover ${isMe ? 'border-violet-500/30' : ''}`}>
                <div className="flex items-start gap-4">
                  {m.profilePicture ? (
                    <img src={m.profilePicture} alt={m.name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ${avatarColor(m.avatar)}`}>{m.avatar}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{m.name}</h3>
                      {isMe && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">You</span>}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m.email}</p>
                    <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium badge-${m.role}`}>{roleLabel(m.role)}</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-3 mt-5">
                  {[
                    { label: 'Total', value: m.taskCount, color: 'text-blue-400' },
                    { label: 'Done', value: m.completedTasks, color: 'text-emerald-400' },
                    { label: 'Active', value: m.inProgressTasks, color: 'text-amber-400' },
                    { label: 'Overdue', value: m.overdueTasks, color: 'text-red-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                      <p className={`text-xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Workload bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--text-muted)' }}>Completion rate</span>
                    <span style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="progress-bar h-2" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>{m.projectCount} project{m.projectCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateMemberModal
          onClose={() => setShowCreateModal(false)}
          onSaved={fetchMembers}
          members={members}
        />
      )}
    </div>
  );
}
