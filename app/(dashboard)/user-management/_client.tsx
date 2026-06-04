'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search, Trash2, Eye, X, Shield, Users,
  CheckCircle2, FolderKanban, Calendar, ChevronRight,
  AlertTriangle, ShieldAlert, UserX,
} from 'lucide-react';
import type { SessionUser, Role } from '@/app/_lib/types';
import { avatarColor, roleLabel } from '@/app/_lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  profilePicture: string;
  taskCount: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  projectCount: number;
}

interface ProjectMember {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  members: ProjectMember[];
}

export default function UserManagementClient({ session }: { session: SessionUser }) {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [deletingUser, setDeletingUser] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [teamRes, projectsRes] = await Promise.all([
        fetch('/api/team'),
        fetch('/api/projects'),
      ]);
      const teamData = await teamRes.json();
      const projectsData = await projectsRes.json();
      setUsers(teamData.users ?? []);
      setProjects(projectsData.projects ?? []);
    } catch (err) {
      console.error('Failed to load user management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/team/${deletingUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
        setDeletingUser(null);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to delete user');
      }
    } catch (err) {
      setError('Internal server error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter((u) =>
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || u.role === roleFilter)
  );

  // Compute stats
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const pmCount = users.filter((u) => u.role === 'project_manager').length;
  const memberCount = users.filter((u) => u.role === 'team_member').length;

  // Filter projects for selected user
  const userProjects = selectedUser
    ? projects.filter((p) => p.members?.some((m) => m.id === selectedUser.id))
    : [];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>User Management</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage platform users, roles, and memberships</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: totalUsers, icon: Users, color: 'bg-violet-500' },
          { label: 'Administrators', value: adminCount, icon: ShieldAlert, color: 'bg-red-500' },
          { label: 'Project Managers', value: pmCount, icon: Shield, color: 'bg-blue-500' },
          { label: 'Team Members', value: memberCount, icon: Users, color: 'bg-emerald-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="surface rounded-2xl p-5 flex items-center gap-4 border border-base">
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

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl input-base text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl input-base text-sm min-w-[160px]"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
          <option value="team_member">Team Member</option>
        </select>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 surface rounded-2xl border border-base">
          <UserX className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No users found</p>
        </div>
      ) : (
        <div className="surface rounded-2xl overflow-hidden border border-base">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['User', 'Email', 'Role', 'Assigned Tasks', 'Projects', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isMe = u.id === session.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-t border-base transition-colors"
                      style={{ '--tw-bg-opacity': 1 } as any}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td className="px-5 py-4 flex items-center gap-3">
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(u.avatar)}`}>
                            {u.avatar}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                            {u.name}
                            {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">You</span>}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium badge-${u.role}`}>
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-5 py-4" style={{ color: 'var(--text-secondary)' }}>{u.taskCount} tasks</td>
                      <td className="px-5 py-4" style={{ color: 'var(--text-secondary)' }}>{u.projectCount} projects</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg btn-secondary"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          </button>
                          {!isMe && (
                            <button
                              onClick={() => setDeletingUser(u)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg btn-secondary hover:bg-red-500/10"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
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
            {filtered.map((u) => {
              const isMe = u.id === session.id;
              return (
                <div key={u.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {u.profilePicture ? (
                      <img src={u.profilePicture} alt={u.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(u.avatar)}`}>
                        {u.avatar}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        {u.name}
                        {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">You</span>}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{u.email}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs py-2 border-t border-b border-base border-dashed" style={{ color: 'var(--text-secondary)' }}>
                    <span>{u.projectCount} project{u.projectCount !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{u.taskCount} task{u.taskCount !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium badge-${u.role}`}>
                      {roleLabel(u.role)}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="px-3 py-1.5 rounded-lg btn-secondary text-xs flex items-center gap-1 font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => setDeletingUser(u)}
                        className="px-3 py-1.5 rounded-lg btn-secondary text-xs flex items-center gap-1 font-medium text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-lg glass rounded-2xl p-6 animate-slide-up space-y-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>User details</h3>
              <button onClick={() => setSelectedUser(null)} className="w-8 h-8 flex items-center justify-center rounded-lg btn-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-4">
              {selectedUser.profilePicture ? (
                <img src={selectedUser.profilePicture} alt={selectedUser.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 shadow-md" />
              ) : (
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${avatarColor(selectedUser.avatar)}`}>
                  {selectedUser.avatar}
                </div>
              )}
              <div className="space-y-1 min-w-0">
                <h4 className="font-bold text-xl truncate" style={{ color: 'var(--text-primary)' }}>{selectedUser.name}</h4>
                <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{selectedUser.email}</p>
                <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium badge-${selectedUser.role}`}>
                  {roleLabel(selectedUser.role)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl space-y-1" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Tasks Count</p>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{selectedUser.taskCount}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl space-y-1" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Assigned Projects</p>
                <div className="flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-violet-400" />
                  <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{selectedUser.projectCount}</span>
                </div>
              </div>
            </div>

            {/* List of projects */}
            <div className="space-y-3">
              <h5 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Assigned Projects List</h5>
              {userProjects.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Not assigned to any projects.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {userProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      onClick={() => setSelectedUser(null)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-base hover:bg-white/5 transition-all text-xs font-semibold group"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="truncate group-hover:text-violet-400 transition-colors">{p.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-all" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="w-full max-w-sm glass rounded-2xl p-6 animate-slide-up space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Delete User?</h3>
            </div>

            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <span className="font-bold text-red-300">{deletingUser.name}</span>? This user will be removed from all projects and unassigned from all tasks. This action is permanent.
            </p>

            {error && <p className="text-sm text-red-400 bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl btn-secondary text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" /> : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
