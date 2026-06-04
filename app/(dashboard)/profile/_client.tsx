'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, CheckCircle2, Clock, AlertTriangle, FolderKanban, 
  Mail, Shield, Calendar, CheckSquare, Zap, FileText, Camera
} from 'lucide-react';
import type { SessionUser, Role, TaskStatus, TaskPriority } from '@/app/_lib/types';
import { avatarColor, roleLabel, formatDate, taskStatusLabel, isOverdue } from '@/app/_lib/utils';

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  projectName: string;
  createdAt: string;
}

interface UserStats {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  taskCount: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  projectCount: number;
}

export default function ProfileClient({ session }: { session: SessionUser }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser>(session);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        setUploadSuccess('Profile picture updated successfully!');
        router.refresh();
      } else {
        setUploadError(data.error ?? 'Failed to upload image');
      }
    } catch (err) {
      console.error(err);
      setUploadError('An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    // Fetch user workload stats by finding the session user in the team members API
    // Fetch user's assigned tasks
    Promise.all([
      fetch('/api/team').then((r) => r.json()),
      fetch(`/api/tasks`).then((r) => r.json())
    ])
      .then(([teamData, tasksData]) => {
        const allUsers: UserStats[] = teamData.users ?? [];
        const userStats = allUsers.find((u) => u.id === session.id);
        if (userStats) {
          setStats(userStats);
        }

        // Filter tasks assigned to the current user
        const allTasks: Task[] = tasksData.tasks ?? [];
        const userTasks = allTasks.filter((t) => t.assignee === session.id);
        setTasks(userTasks);

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [session.id]);

  const completionRate = stats?.taskCount 
    ? Math.round((stats.completedTasks / stats.taskCount) * 100) 
    : 0;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your account settings and track your performance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full spinner" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Details Card */}
          <div className="surface rounded-2xl p-6 flex flex-col items-center text-center border border-base h-fit lg:col-span-1">
            <div className="relative group w-20 h-20 mb-4 flex-shrink-0">
              {currentUser.profilePicture ? (
                <img src={currentUser.profilePicture} alt={currentUser.name} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
              ) : (
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-md ${avatarColor(currentUser.avatar)}`}>
                  {currentUser.avatar}
                </div>
              )}
              
              {/* Overlay for uploading image */}
              <label 
                htmlFor="profile-pic-upload"
                className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-white mb-1" />
                    <span className="text-[10px] text-white font-medium">Change</span>
                  </>
                )}
              </label>
              <input 
                id="profile-pic-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{currentUser.name}</h2>
            <span className={`inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold badge-${currentUser.role}`}>
              {roleLabel(currentUser.role)}
            </span>
            {uploadError && <p className="text-xs text-red-400 mt-2">{uploadError}</p>}
            {uploadSuccess && <p className="text-xs text-emerald-400 mt-2">{uploadSuccess}</p>}

            <div className="w-full border-t border-base mt-6 pt-5 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">Email Address</span>
                  <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{session.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">System Permissions</span>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {session.role === 'admin' ? 'Full Access (Administrator)' : session.role === 'project_manager' ? 'Manage Projects & Teams' : 'Standard Member Access'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block">Account Status</span>
                  <p className="text-sm text-emerald-400 font-medium">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance & Workload Analytics */}
          <div className="lg:col-span-2 space-y-6">
            <div className="surface rounded-2xl p-6 border border-base">
              <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Workload Summary</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Projects Involved', value: stats?.projectCount ?? 0, color: 'text-violet-400' },
                  { label: 'Assigned Tasks', value: stats?.taskCount ?? 0, color: 'text-blue-400' },
                  { label: 'Completed Tasks', value: stats?.completedTasks ?? 0, color: 'text-emerald-400' },
                  { label: 'Overdue Tasks', value: stats?.overdueTasks ?? 0, color: 'text-red-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-4 rounded-xl text-center border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] mt-1 uppercase font-semibold tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Completion rate bar */}
              <div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Task Completion Rate</span>
                  <span className="font-bold text-violet-400">{completionRate}%</span>
                </div>
                <div className="h-3 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="progress-bar h-3" style={{ width: `${completionRate}%` }} />
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  You have completed {stats?.completedTasks ?? 0} out of {stats?.taskCount ?? 0} tasks assigned to you.
                </p>
              </div>
            </div>

            {/* My Tasks Listing */}
            <div className="surface rounded-2xl p-6 border border-base">
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare className="w-4 h-4 text-violet-400" />
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Assigned Tasks</h3>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-base" style={{ background: 'var(--bg-elevated)' }}>
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No tasks assigned to you yet.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-base">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Task Title</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Project</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Priority</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => {
                          const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
                          return (
                            <tr 
                              key={task.id} 
                              onClick={() => router.push(`/projects/${task.projectId}`)}
                              className="border-t border-base hover:bg-slate-800/25 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3.5 max-w-[200px] truncate">
                                <Link 
                                  href={`/projects/${task.projectId}?taskId=${task.id}`} 
                                  onClick={(e) => e.stopPropagation()}
                                  className={`font-semibold text-xs hover:underline hover:text-violet-400 transition-colors ${
                                    task.status === 'completed' ? 'line-through opacity-60' : ''
                                  }`}
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {task.title}
                                </Link>
                              </td>
                              <td className="px-4 py-3.5 truncate">
                                <Link 
                                  href={`/projects/${task.projectId}`} 
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-semibold hover:underline" 
                                  style={{ color: 'oklch(72% 0.22 264)' }}
                                >
                                  {task.projectName}
                                </Link>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium badge-${task.priority}`}>
                                  {task.priority}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium badge-${task.status}`}>
                                  {taskStatusLabel(task.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`text-xs ${overdue ? 'text-red-400 font-semibold' : ''}`} style={overdue ? {} : { color: 'var(--text-muted)' }}>
                                  {formatDate(task.dueDate)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {tasks.map((task) => {
                      const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
                      return (
                        <div 
                          key={task.id} 
                          onClick={() => router.push(`/projects/${task.projectId}?taskId=${task.id}`)}
                          className={`surface rounded-xl p-4 border border-base space-y-3 cursor-pointer hover:bg-slate-800/25 transition-colors ${overdue ? 'border-red-500/20' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm ${task.status === 'completed' ? 'line-through opacity-60' : ''}`} style={{ color: 'var(--text-primary)' }}>
                                {task.title}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                Project: <span className="text-violet-400 font-semibold">{task.projectName}</span>
                              </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium badge-${task.priority}`}>
                              {task.priority}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-base border-dashed">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium badge-${task.status}`}>
                              {taskStatusLabel(task.status)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className={`text-xs ${overdue ? 'text-red-400 font-semibold' : ''}`} style={overdue ? {} : { color: 'var(--text-secondary)' }}>
                                {formatDate(task.dueDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
