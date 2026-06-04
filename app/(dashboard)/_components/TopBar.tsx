'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sun, Moon, LogOut, Bell, Menu } from 'lucide-react';
import { useTheme } from '@/app/_components/ThemeProvider';
import type { SessionUser } from '@/app/_lib/types';
import { avatarColor } from '@/app/_lib/utils';

export default function TopBar({
  user,
  onMenuToggle,
}: {
  user: SessionUser;
  onMenuToggle: () => void;
}) {
  const { theme, toggle } = useTheme();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 md:px-6 glass border-b border-base">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Toggle Button */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl btn-secondary flex items-center justify-center cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>

        <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <Link
          href="/activity"
          id="topbar-notifications"
          className="w-9 h-9 rounded-xl flex items-center justify-center btn-secondary relative"
          title="Notifications / Activity"
        >
          <Bell className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500"></span>
        </Link>

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
        <Link href="/profile" id="topbar-profile" className="cursor-pointer shadow-sm" title="My Profile">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.name} className="w-9 h-9 rounded-xl object-cover hover:opacity-90 transition-opacity" />
          ) : (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity ${avatarColor(user.avatar)}`}>
              {user.avatar}
            </div>
          )}
        </Link>

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
