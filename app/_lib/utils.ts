import type { TaskPriority, TaskStatus, ProjectStatus, Role } from './types';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function isOverdue(date: string): boolean {
  return new Date(date) < new Date();
}

export function daysUntil(date: string): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function priorityColor(p: TaskPriority): string {
  return { high: 'red', medium: 'amber', low: 'emerald' }[p];
}

export function statusColor(s: TaskStatus): string {
  return { todo: 'slate', in_progress: 'blue', completed: 'emerald' }[s];
}

export function projectStatusColor(s: ProjectStatus): string {
  return { active: 'blue', completed: 'emerald', on_hold: 'amber' }[s];
}

export function roleLabel(r: Role): string {
  return { admin: 'Admin', project_manager: 'Project Manager', team_member: 'Team Member' }[r];
}

export function taskStatusLabel(s: TaskStatus): string {
  return { todo: 'To Do', in_progress: 'In Progress', completed: 'Completed' }[s];
}

export function projectStatusLabel(s: ProjectStatus): string {
  return { active: 'Active', completed: 'Completed', on_hold: 'On Hold' }[s];
}

export function avatarColor(initials: string): string {
  const colors = [
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500',
    'bg-teal-500', 'bg-rose-500', 'bg-orange-500', 'bg-pink-500',
  ];
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) ?? 0)) % colors.length;
  return colors[idx];
}
