'use client';
import { useRouter } from 'next/navigation';
import { Sun, Moon, LogOut, Bell } from 'lucide-react';
import { useTheme } from '@/app/_components/ThemeProvider';
import type { SessionUser } from '@/app/_lib/types';
import { avatarColor } from '@/app/_lib/utils';

export default function TopBar({ user }: { user: SessionUser }) {
  const { theme, toggle } = useTheme();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="flex-shrink-0 h-16 flex items-center justify-between px-6 glass border-b border-base">
      <div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications bell (decorative) */}
        <button
          id="topbar-notifications"
          className="w-9 h-9 rounded-xl flex items-center justify-center btn-secondary relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500"></span>
        </button>

        {/* Theme toggle */}
        <button
          id="topbar-theme-toggle"
          onClick={toggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center btn-secondary"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            : <Moon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
        </button>

        {/* Avatar */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold ${avatarColor(user.avatar)}`}>
          {user.avatar}
        </div>

        {/* Logout */}
        <button
          id="topbar-logout"
          onClick={logout}
          className="w-9 h-9 rounded-xl flex items-center justify-center btn-secondary"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>
    </header>
  );
}
