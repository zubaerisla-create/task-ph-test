'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Filter, CheckCircle2, Clock, AlertCircle, Calendar, SortAsc, Trash2, Edit, X, Plus } from 'lucide-react';
import type { SessionUser, TaskStatus, TaskPriority } from '@/app/_lib/types';
import { formatDate, isOverdue, taskStatusLabel, daysUntil, avatarColor } from '@/app/_lib/utils';

interface Task {
  id: string; projectId: string; title: string; description: string;
  assignee: string; dueDate: string; priority: TaskPriority; status: TaskStatus;
  projectName: string; assigneeUser: { id: string; name: string; avatar: string; profilePicture?: string } | null;
  createdAt: string;
}
interface Member { id: string; name: string; }
interface Project { id: string; name: string; }

const PAGE_SIZE = 10;

export default function TasksClient({ session }: { session: SessionUser }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({ status: '' as TaskStatus, priority: '' as TaskPriority });
  const [editError, setEditError] = useState('');

  const fetchTasks = () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status: statusFilter, priority: priorityFilter, projectId: projectFilter, assignee: assigneeFilter, sort });
    fetch(`/api/tasks?${params}`).then((r) => r.json()).then((d) => { setTasks(d.tasks ?? []); setLoading(false); setPage(1); });
  };

  useEffect(() => {
    fetch('/api/team').then((r) => r.json()).then((d) => setMembers(d.users ?? []));
    fetch('/api/projects').then((r) => r.json()).then((d) => setProjects(d.projects ?? []));
  }, []);

  useEffect(() => { fetchTasks(); }, [search, statusFilter, priorityFilter, projectFilter, assigneeFilter, sort]);

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setEditForm({ status: task.status, priority: task.priority });
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editTask) return;
    const res = await fetch(`/api/tasks/${editTask.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (res.ok) { setEditTask(null); fetchTasks(); }
    else setEditError(data.error ?? 'Failed to update');
  };

  const canDelete = session.role !== 'team_member';
  const paginated = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(tasks.length / PAGE_SIZE);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>All Tasks</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="surface rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2.5 rounded-xl input-base text-sm" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-4 py-2.5 rounded-xl input-base text-sm">
            <option value="createdAt">Latest Created</option>
            <option value="dueDate">Nearest Deadline</option>
            <option value="priority">Highest Priority</option>
            <option value="updatedAt">Recently Updated</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
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
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-3 py-2 rounded-xl input-base text-xs">
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {session.role !== 'team_member' && (
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="px-3 py-2 rounded-xl input-base text-xs">
              <option value="">All Members</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
          {(statusFilter || priorityFilter || projectFilter || assigneeFilter || search) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); setProjectFilter(''); setAssigneeFilter(''); }}
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl text-red-400 bg-red-500/10 border border-red-500/20">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full spinner" /></div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No tasks found</p>
        </div>
      ) : (
        <div className="surface rounded-2xl overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Task', 'Project', 'Assignee', 'Priority', 'Status', 'Due Date', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((task) => {
                  const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
                  return (
                    <tr key={task.id} className="border-t border-base transition-colors cursor-pointer" style={{ '--tw-bg-opacity': 1 } as any}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                        router.push(`/projects/${task.projectId}`);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className={`font-medium truncate ${task.status === 'completed' ? 'line-through opacity-60' : ''}`} style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                        {task.description && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{task.description}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/projects/${task.projectId}`} className="text-xs hover:underline" style={{ color: 'oklch(72% 0.22 264)' }}>{task.projectName}</Link>
                      </td>
                      <td className="px-5 py-4">
                        {task.assigneeUser && (
                          <div className="flex items-center gap-2">
                            {task.assigneeUser.profilePicture ? (
                              <img src={task.assigneeUser.profilePicture} alt={task.assigneeUser.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(task.assigneeUser.avatar)}`}>{task.assigneeUser.avatar}</div>
                            )}
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{task.assigneeUser.name.split(' ')[0]}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium badge-${task.priority}`}>{task.priority}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium badge-${task.status}`}>{taskStatusLabel(task.status)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs ${overdue ? 'text-red-400' : ''}`} style={overdue ? {} : { color: 'var(--text-muted)' }}>{formatDate(task.dueDate)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(task)} className="w-7 h-7 flex items-center justify-center rounded-lg btn-secondary" title="Quick edit">
                            <Edit className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                          </button>
                          {canDelete && (
                            <button onClick={() => deleteTask(task.id)} className="w-7 h-7 flex items-center justify-center rounded-lg btn-secondary" title="Delete">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-base">
            {paginated.map((task) => {
              const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
              return (
                <div key={task.id} className="p-4 space-y-3 cursor-pointer transition-colors"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                    router.push(`/projects/${task.projectId}`);
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm ${task.status === 'completed' ? 'line-through opacity-60' : ''}`} style={{ color: 'var(--text-primary)' }}>
                        {task.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Project: <Link href={`/projects/${task.projectId}`} className="hover:underline text-violet-400 font-medium">{task.projectName}</Link>
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 badge-${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {task.assigneeUser ? (
                      <div className="flex items-center gap-1.5">
                        {task.assigneeUser.profilePicture ? (
                          <img src={task.assigneeUser.profilePicture} alt={task.assigneeUser.name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${avatarColor(task.assigneeUser.avatar)}`}>
                            {task.assigneeUser.avatar}
                          </div>
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{task.assigneeUser.name.split(' ')[0]}</span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className={`text-xs ${overdue ? 'text-red-400 font-medium' : ''}`} style={overdue ? {} : { color: 'var(--text-secondary)' }}>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-base border-dashed">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium badge-${task.status}`}>
                      {taskStatusLabel(task.status)}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(task)} className="px-3 py-1.5 rounded-lg btn-secondary text-xs flex items-center gap-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      {canDelete && (
                        <button onClick={() => deleteTask(task.id)} className="px-3 py-1.5 rounded-lg btn-secondary text-xs flex items-center gap-1 font-medium text-red-400">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-base">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, tasks.length)} of {tasks.length}
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg btn-secondary text-xs disabled:opacity-40" style={{ color: 'var(--text-secondary)' }}>← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium ${page === p ? 'btn-primary' : 'btn-secondary'}`} style={page !== p ? { color: 'var(--text-secondary)' } : {}}>{p}</button>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg btn-secondary text-xs disabled:opacity-40" style={{ color: 'var(--text-secondary)' }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick edit modal */}
      {editTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={() => setEditTask(null)}>
          <div className="w-full max-w-sm glass rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Quick Update</h3>
              <button onClick={() => setEditTask(null)} className="w-8 h-8 flex items-center justify-center rounded-lg btn-secondary"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm mb-4 font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{editTask.title}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as TaskStatus }))} className="w-full px-4 py-2.5 rounded-xl input-base text-sm">
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</label>
                <select value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))} className="w-full px-4 py-2.5 rounded-xl input-base text-sm">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              {editError && <p className="text-sm text-red-400 bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">{editError}</p>}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditTask(null)} className="flex-1 py-2.5 rounded-xl btn-secondary text-sm" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl btn-primary text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
