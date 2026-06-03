'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users,
  BarChart3, Activity, Zap, ChevronRight,
} from 'lucide-react';
import type { SessionUser } from '@/app/_lib/types';
import { avatarColor, roleLabel } from '@/app/_lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/activity', label: 'Activity', icon: Activity },
];

export default function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full glass border-r border-base">
      {/* Logo */}
      <div className="p-6 border-b border-base">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold gradient-text leading-none">CollabFlow</span>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {user.role === 'admin' ? 'Admin Panel' : user.role === 'project_manager' ? 'PM Workspace' : 'Team Space'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-3" style={{ color: 'var(--text-muted)' }}>
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase()}`}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-base">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColor(user.avatar)}`}>
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{roleLabel(user.role)}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
