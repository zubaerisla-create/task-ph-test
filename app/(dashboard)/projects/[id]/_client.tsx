'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, Edit, X, Calendar, CheckCircle2,
  Clock, AlertCircle, MessageSquare, ChevronDown, UserPlus,
} from 'lucide-react';
import type { SessionUser, TaskStatus, TaskPriority } from '@/app/_lib/types';
import { formatDate, daysUntil, isOverdue, taskStatusLabel, avatarColor, projectStatusLabel } from '@/app/_lib/utils';

interface Comment { id: string; content: string; createdAt: string; author: { name: string; avatar: string } | null; }
interface TaskMember { id: string; name: string; avatar: string; }
interface Task {
  id: string; projectId: string; title: string; description: string; assignee: string;
  dueDate: string; priority: TaskPriority; status: TaskStatus; comments: Comment[];
  assigneeUser: TaskMember | null; createdAt: string;
}
interface Member { id: string; name: string; avatar: string; role: string; email: string; }
interface Project {
  id: string; name: string; description: string; deadline: string; status: string;
  members: Member[]; tasks: Task[]; taskCount: number; completedTasks: number;
}

function TaskForm({
  onClose, onSave, projectId, members, initial,
}: {
  onClose: () => void; onSave: () => void; projectId: string;
  members: Member[]; initial?: Task;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    assignee: initial?.assignee ?? (members[0]?.id ?? ''),
    dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
    priority: initial?.priority ?? 'medium',
    status: initial?.status ?? 'todo',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const url = isEdit ? `/api/tasks/${initial!.id}` : '/api/tasks';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, projectId, dueDate: new Date(form.dueDate).toISOString() }),
    });
    const data = await res.json();
    if (res.ok) { onSave(); onClose(); }
    else { setError(data.error ?? 'Failed to save task'); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div className="w-full max-w-lg glass rounded-2xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{isEdit ? 'Edit Task' : 'Create Task'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg btn-secondary"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title *</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl input-base text-sm" placeholder="Task title" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl input-base text-sm resize-none" placeholder="Optional description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Assignee *</label>
              <select required value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl input-base text-sm">
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Due Date *</label>
              <input required type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl input-base text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Priority</label>
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))} className="w-full px-4 py-2.5 rounded-xl input-base text-sm">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))} className="w-full px-4 py-2.5 rounded-xl input-base text-sm">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl btn-secondary text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl btn-primary text-sm font-medium flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" /> : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task, session, onEdit, onDelete, onStatusChange }: {
  task: Task; session: SessionUser;
  onEdit: () => void; onDelete: () => void; onStatusChange: (s: TaskStatus) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(task.comments);
  const [postingComment, setPostingComment] = useState(false);
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
  const canEdit = session.role !== 'team_member' || task.assignee === session.id;
  const canDelete = session.role !== 'team_member';

  const postComment = async () => {
    if (!comment.trim()) return;
    setPostingComment(true);
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment }),
    });
    const data = await res.json();
    if (res.ok) {
      setComments((c) => [...c, data.comment]);
      setComment('');
    }
    setPostingComment(false);
  };

  return (
    <div className={`surface rounded-xl p-4 card-hover ${overdue ? 'border-red-500/20' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button onClick={() => onStatusChange(task.status === 'completed' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'in_progress')}
          className="mt-0.5 flex-shrink-0" title="Toggle status">
          {task.status === 'completed'
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            : task.status === 'in_progress'
            ? <Clock className="w-5 h-5 text-blue-400" />
            : <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'var(--text-muted)' }} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-medium text-sm ${task.status === 'completed' ? 'line-through opacity-60' : ''}`} style={{ color: 'var(--text-primary)' }}>{task.title}</p>
            <div className="flex gap-1 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium badge-${task.priority}`}>{task.priority}</span>
            </div>
          </div>
          {task.description && <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{task.description}</p>}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {task.assigneeUser && (
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(task.assigneeUser.avatar)}`}>{task.assigneeUser.avatar}</div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.assigneeUser.name.split(' ')[0]}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" style={{ color: overdue ? '#f87171' : 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: overdue ? '#f87171' : 'var(--text-muted)' }}>{formatDate(task.dueDate)}</span>
            </div>
            <button onClick={() => setShowComments((s) => !s)} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <MessageSquare className="w-3 h-3" />{comments.length}
            </button>
            {canEdit && <button onClick={onEdit} className="text-xs" style={{ color: 'oklch(72% 0.22 264)' }}>Edit</button>}
            {canDelete && <button onClick={onDelete} className="text-xs text-red-400">Delete</button>}
          </div>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-base space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(c.author?.avatar ?? 'U')}`}>{c.author?.avatar ?? '?'}</div>
              <div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{c.author?.name}</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.content}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{formatDate(c.createdAt)}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && postComment()}
              placeholder="Add a comment..." className="flex-1 px-3 py-1.5 rounded-lg input-base text-xs" />
            <button onClick={postComment} disabled={postingComment || !comment.trim()}
              className="px-3 py-1.5 rounded-lg btn-primary text-xs font-medium disabled:opacity-50">Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailClient({ session, projectId }: { session: SessionUser; projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [allUsers, setAllUsers] = useState<Member[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [memberToAdd, setMemberToAdd] = useState('');

  const fetchProject = () => {
    fetch(`/api/projects/${projectId}`).then((r) => r.json()).then((d) => { setProject(d.project); setLoading(false); });
  };

  useEffect(() => {
    fetchProject();
    fetch('/api/team').then((r) => r.json()).then((d) => setAllUsers(d.users ?? []));
  }, [projectId]);

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchProject();
  };

  const changeTaskStatus = async (taskId: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    fetchProject();
  };

  const addMember = async () => {
    if (!memberToAdd) return;
    await fetch(`/api/projects/${projectId}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: memberToAdd }),
    });
    setAddingMember(false);
    fetchProject();
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full spinner" /></div>;
  if (!project) return <div className="text-center py-20"><p style={{ color: 'var(--text-secondary)' }}>Project not found</p></div>;

  const filteredTasks = project.tasks.filter((t) =>
    (statusFilter ? t.status === statusFilter : true) &&
    (priorityFilter ? t.priority === priorityFilter : true)
  );
  const progress = project.taskCount ? Math.round((project.completedTasks / project.taskCount) * 100) : 0;
  const canManage = session.role !== 'team_member';
  const nonMembers = allUsers.filter((u) => !project.members.find((m) => m.id === u.id));

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'To Do', color: 'text-slate-400' },
    { status: 'in_progress', label: 'In Progress', color: 'text-blue-400' },
    { status: 'completed', label: 'Completed', color: 'text-emerald-400' },
  ];

  return (
    <div className="max-w-7xl space-y-6">
      {/* Back */}
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      {/* Project Header */}
      <div className="surface rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium badge-${project.status}`}>{projectStatusLabel(project.status as any)}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Due {formatDate(project.deadline)}</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Members */}
            <div className="flex -space-x-2">
              {project.members.slice(0, 5).map((m) => (
                <div key={m.id} title={m.name} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold ${avatarColor(m.avatar)}`} style={{ borderColor: 'var(--bg-surface)' }}>{m.avatar}</div>
              ))}
            </div>
            {canManage && (
              <button onClick={() => setAddingMember(true)} className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center btn-secondary" style={{ borderColor: 'var(--border-color)' }}>
                <UserPlus className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: 'var(--text-muted)' }}>{project.completedTasks}/{project.taskCount} tasks completed</span>
            <span style={{ color: 'var(--text-muted)' }}>{progress}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
            <div className="progress-bar h-2" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Add member modal */}
      {addingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={() => setAddingMember(false)}>
          <div className="w-full max-w-sm glass rounded-2xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Add Team Member</h3>
            <select value={memberToAdd} onChange={(e) => setMemberToAdd(e.target.value)} className="w-full px-4 py-2.5 rounded-xl input-base text-sm mb-4">
              <option value="">Select member...</option>
              {nonMembers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setAddingMember(false)} className="flex-1 py-2 rounded-xl btn-secondary text-sm" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={addMember} disabled={!memberToAdd} className="flex-1 py-2 rounded-xl btn-primary text-sm font-medium disabled:opacity-50">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Board */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Tasks</h2>
          <div className="flex gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl input-base text-xs">
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 rounded-xl input-base text-xs">
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {canManage && (
              <button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm font-semibold">
                <Plus className="w-4 h-4" /> Task
              </button>
            )}
          </div>
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map(({ status, label, color }) => {
            const colTasks = filteredTasks.filter((t) => t.status === status);
            return (
              <div key={status} className="kanban-column p-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className={`font-semibold text-sm ${color}`}>{label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>{colTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {colTasks.map((t) => (
                    <TaskCard key={t.id} task={t} session={session}
                      onEdit={() => setEditTask(t)}
                      onDelete={() => deleteTask(t.id)}
                      onStatusChange={(s) => changeTaskStatus(t.id, s)}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-center text-xs py-8" style={{ color: 'var(--text-muted)' }}>No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forms */}
      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} onSave={fetchProject} projectId={projectId} members={project.members} />}
      {editTask && <TaskForm onClose={() => setEditTask(null)} onSave={fetchProject} projectId={projectId} members={project.members} initial={editTask} />}
    </div>
  );
}
