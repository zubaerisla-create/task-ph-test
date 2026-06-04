'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Zap, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@/app/_components/ThemeProvider';

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const logoSrc = theme === 'light' ? '/dark-logo-removebg-preview.png' : '/white-logo-removebg-preview.png';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError(data.error ?? 'Login failed');
      setLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'pm' | 'member') => {
    const creds = {
      admin: { email: 'admin@gmail.com', password: '123456' },
      pm: { email: 'pm@gmail.com', password: '123456' },
      member: { email: 'member@gmail.com', password: '123456' },
    };
    setForm(creds[role]);
    setError('');
  };

  return (
    <div className="animate-slide-up">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex flex-col items-center justify-center mb-4">
          <img src={logoSrc} alt="Logo" className="h-16 w-auto object-contain mb-2" />
          <span className="text-2xl font-bold gradient-text">Task Track</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Welcome back
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Sign in to your workspace</p>
      </div>

      {/* Demo buttons */}
      <div className="glass rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          ⚡ Quick Demo Login
        </p>
        <div className="flex gap-2">
          {[
            { key: 'admin' as const, label: 'Admin', color: 'text-violet-400' },
            { key: 'pm' as const, label: 'Project Manager', color: 'text-blue-400' },
            { key: 'member' as const, label: 'Team Member', color: 'text-emerald-400' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => fillDemo(key)}
              className={`flex-1 text-xs py-2 px-2 rounded-lg btn-secondary font-medium ${color} transition-all duration-200`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="glass rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl input-base text-sm"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <Link href="/forgot-password" className="text-xs hover:underline animate-fade-in" style={{ color: 'oklch(75% 0.22 264)' }}>
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl input-base text-sm pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-300 bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl btn-primary font-semibold text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: 'oklch(75% 0.22 264)' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
