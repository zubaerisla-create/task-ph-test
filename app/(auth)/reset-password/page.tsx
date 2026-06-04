'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/app/_components/ThemeProvider';


function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-8">
      {success ? (
        <div className="space-y-5 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-emerald-400">Password Reset!</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
          <Link
            href="/login"
            className="mt-4 w-full py-3 rounded-xl btn-primary font-semibold text-sm flex items-center justify-center gap-2"
          >
            Go to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {!token && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-300 bg-red-500/10 border border-red-500/20">
              Warning: Reset token is missing. This submission will fail.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              New Password
            </label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPwd ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Confirm New Password
            </label>
            <input
              id="reset-confirm-password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 rounded-xl input-base text-sm"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-300 bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}

          <button
            id="reset-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl btn-primary font-semibold text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
            ) : (
              'Reset Password'
            )}
          </button>

          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            <Link href="/login" className="inline-flex items-center gap-1.5 font-medium hover:underline hover:text-violet-400">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const { theme } = useTheme();
  const logoSrc = theme === 'light' ? '/dark-logo-removebg-preview.png' : '/white-logo-removebg-preview.png';

  return (
    <div className="animate-slide-up">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex flex-col items-center justify-center mb-4">
          <img src={logoSrc} alt="Logo" className="h-16 w-auto object-contain mb-2" />
          <span className="text-2xl font-bold gradient-text">Task Track</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Create New Password
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Choose a secure, strong password for your account
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full spinner" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
