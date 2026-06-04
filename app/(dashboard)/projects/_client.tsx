'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, FolderKanban, Calendar, CheckCircle2, ChevronRight, Trash2, Edit, X } from 'lucide-react';
import type { SessionUser, ProjectStatus } from '@/app/_lib/types';
import { formatDate, isOverdue, projectStatusLabel, projectStatusColor, avatarColor, daysUntil } from '@/app/_lib/utils';

interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  status: ProjectStatus;
  taskCount: number;
  completedTasks: number;
  members: { id: string; name: string; avatar: string; profilePicture?: string }[];
  createdAt: string;
}

function ProjectForm({
  onClose,
  onSave,
  users,
  initial,
}: {
  onClose: () => void;
  onSave: () => void;
  users: { id: string; name: string }[];
  initial?: Project;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    deadline: initial?.deadline ? initial.deadline.slice(0, 10) : '',
    status: initial?.status ?? 'active',
    members: initial?.members?.map((m) => m.id) ?? [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const url = isEdit ? `/api/projects/${initial!.id}` : '/api/projects';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, deadline: new Date(form.deadline).toISOString() }),
    });
    const data = await res.json();
    if (res.ok) {
      onSave();
      onClose();
    } else {
      setError(data.error ?? 'Failed to save project');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div className="w-full max-w-lg glass rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg btn-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Project Name *</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl input-base text-sm" placeholder="E.g. E-Commerce Platform" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl input-base text-sm resize-none" placeholder="Project description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Deadline *</label>
              <input required type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl input-base text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
                className="w-full px-4 py-2.5 rounded-xl input-base text-sm">
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl btn-secondary text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl btn-primary text-sm font-medium flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" /> : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsClient({ session }: { session: SessionUser }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const fetchProjects = () => {
    setLoading(true);
    fetch(`/api/projects?search=${search}&status=${statusFilter}`)
      .then((r) => r.json())
      .then((d) => { setProjects(d.projects ?? []); setLoading(false); });
  };

  useEffect(() => {
    fetch('/api/team').then((r) => r.json()).then((d) => setUsers(d.users ?? []));
  }, []);

  useEffect(() => { fetchProjects(); }, [search, statusFilter]);

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    fetchProjects();
  };

  const canManage = session.role !== 'team_member';

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} found</p>
        </div>
        {canManage && (
          <button id="create-project-btn" onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..." className="w-full pl-10 pr-4 py-2.5 rounded-xl input-base text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl input-base text-sm min-w-[140px]">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full spinner" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No projects found</p>
          {canManage && <button onClick={() => setShowForm(true)} className="mt-4 px-5 py-2 rounded-xl btn-primary text-sm">Create your first project</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p) => {
            const progress = p.taskCount ? Math.round((p.completedTasks / p.taskCount) * 100) : 0;
            const days = daysUntil(p.deadline);
            const overdue = isOverdue(p.deadline) && p.status !== 'completed';
            return (
              <div key={p.id} className="surface rounded-2xl p-6 card-hover flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium badge-${p.status}`}>
                    {projectStatusLabel(p.status)}
                  </span>
                  {canManage && (
                    <div className="flex gap-1">
                      <button onClick={() => setEditProject(p)} className="w-7 h-7 rounded-lg flex items-center justify-center btn-secondary" title="Edit">
                        <Edit className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      </button>
                      {session.role === 'admin' && (
                        <button onClick={() => deleteProject(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center btn-secondary" title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-base mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
                <p className="text-sm mb-4 line-clamp-2 flex-1" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--text-muted)' }}>{p.completedTasks}/{p.taskCount} tasks</span>
                    <span style={{ color: 'var(--text-muted)' }}>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="progress-bar h-1.5" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Members */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {p.members.slice(0, 4).map((m) => (
                      <div key={m.id} title={m.name} className="relative w-7 h-7">
                        {m.profilePicture ? (
                          <img src={m.profilePicture} alt={m.name} className="w-7 h-7 rounded-full object-cover border-2" style={{ borderColor: 'var(--bg-surface)' }} />
                        ) : (
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold ${avatarColor(m.avatar)}`} style={{ borderColor: 'var(--bg-surface)' }}>
                            {m.avatar}
                          </div>
                        )}
                      </div>
                    ))}
                    {p.members.length > 4 && (
                      <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold bg-elevated" style={{ borderColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                        +{p.members.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar className="w-3 h-3" style={{ color: overdue ? '#f87171' : 'var(--text-muted)' }} />
                    <span style={{ color: overdue ? '#f87171' : 'var(--text-muted)' }}>
                      {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                    </span>
                  </div>
                </div>

                <Link href={`/projects/${p.id}`} className="mt-4 flex items-center gap-1 text-xs font-medium" style={{ color: 'oklch(72% 0.22 264)' }}>
                  View project <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Forms */}
      {showForm && <ProjectForm onClose={() => setShowForm(false)} onSave={fetchProjects} users={users} />}
      {editProject && <ProjectForm onClose={() => setEditProject(null)} onSave={fetchProjects} users={users} initial={editProject} />}
    </div>
  );
}
