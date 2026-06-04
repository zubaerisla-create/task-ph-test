'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users,
  BarChart3, Activity, Zap, ChevronRight, ShieldAlert, X,
} from 'lucide-react';
import type { SessionUser } from '@/app/_lib/types';
import { avatarColor, roleLabel } from '@/app/_lib/utils';
import { useTheme } from '@/app/_components/ThemeProvider';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/team', label: 'Team Members', icon: Users },
  { href: '/user-management', label: 'Users', icon: ShieldAlert, adminOnly: true },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/activity', label: 'Activity', icon: Activity },
];

export default function Sidebar({
  user,
  isOpen,
  onClose,
}: {
  user: SessionUser;
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const isAdmin = user.role === 'admin';
  const { theme } = useTheme();

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const logoSrc = theme === 'light' ? '/dark-logo-removebg-preview.png' : '/white-logo-removebg-preview.png';

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex-shrink-0 flex flex-col h-full glass border-r border-base transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-base flex items-center justify-between relative">
          <div className="flex flex-col items-center justify-center text-center flex-1">
            <img src={logoSrc} alt="Logo" className="h-16 w-auto object-contain mb-1" />
            <span className="text-lg font-bold gradient-text mb-2">Task Track</span>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {user.role === 'admin' ? 'Admin Panel' : user.role === 'project_manager' ? 'PM Workspace' : 'Team Space'}
            </p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg btn-secondary absolute top-4 right-4"
            title="Close sidebar"
          >
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-3" style={{ color: 'var(--text-muted)' }}>
            Navigation
          </p>
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                id={`nav-${label.toLowerCase()}`}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
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
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColor(user.avatar)}`}>
                {user.avatar}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{roleLabel(user.role)}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
