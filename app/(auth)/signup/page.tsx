'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Zap, Eye, EyeOff } from 'lucide-react';
import type { Role } from '../../_lib/types';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'team_member' as Role });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError(data.error ?? 'Signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">CollabFlow</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Create account
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Join your team workspace</p>
      </div>

      <div className="glass rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl input-base text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl input-base text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Role
            </label>
            <select
              id="signup-role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              className="w-full px-4 py-3 rounded-xl input-base text-sm"
            >
              <option value="team_member">Team Member</option>
              <option value="project_manager">Project Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPwd ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 rounded-xl input-base text-sm pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
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
            id="signup-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl btn-primary font-semibold text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: 'oklch(75% 0.22 264)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
