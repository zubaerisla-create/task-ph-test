export type Role = 'admin' | 'project_manager' | 'team_member';
export type ProjectStatus = 'active' | 'completed' | 'on_hold';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'high' | 'medium' | 'low';
export type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'project_completed'
  | 'task_created'
  | 'task_updated'
  | 'task_assigned'
  | 'task_completed'
  | 'task_status_changed'
  | 'member_added'
  | 'member_removed'
  | 'comment_added';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  avatar: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  status: ProjectStatus;
  createdBy: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  comments: Comment[];
  attachments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  type: ActivityType;
  message: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  createdAt: string;
}

export interface DB {
  users: User[];
  projects: Project[];
  tasks: Task[];
  activityLog: ActivityLog[];
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}
