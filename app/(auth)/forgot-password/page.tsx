'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/app/_components/ThemeProvider';

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const logoSrc = theme === 'light' ? '/dark-logo-removebg-preview.png' : '/white-logo-removebg-preview.png';

  const [email, setEmail] = useState('');

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? 'Failed to send reset link');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
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
          Reset Password
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Enter your email to receive a password reset link
        </p>
      </div>

      {/* Form */}
      <div className="glass rounded-2xl p-8">
        {success ? (
          <div className="space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-emerald-400">Email Sent!</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Check your inbox for a link to reset your password. The link will expire in 1 hour.
            </p>
            <Link
              href="/login"
              className="mt-4 w-full py-3 rounded-xl btn-primary font-semibold text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl input-base text-sm"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-300 bg-red-500/10 border border-red-500/20">
                {error}
              </div>
            )}

            <button
              id="forgot-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-primary font-semibold text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
              ) : (
                'Send Reset Link'
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
    </div>
  );
}
