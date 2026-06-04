'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Zap, Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';
import type { Role } from '../../_lib/types';
import { useTheme } from '@/app/_components/ThemeProvider';

export default function SignupPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const logoSrc = theme === 'light' ? '/dark-logo-removebg-preview.png' : '/white-logo-removebg-preview.png';

  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'team_member' as Role });

  // 6-digit OTP states
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('otp');
      } else {
        setError(data.error ?? 'Failed to send verification code');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const otpCode = otpValues.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit OTP code');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error ?? 'Invalid verification code');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updatedValues = [...otpValues];
    updatedValues[index] = digit;
    setOtpValues(updatedValues);

    // Auto-focus next input
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const updatedValues = [...otpValues];
        updatedValues[index - 1] = '';
        setOtpValues(updatedValues);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const updatedValues = [...otpValues];
        updatedValues[index] = '';
        setOtpValues(updatedValues);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const updatedValues = [...otpValues];
      for (let i = 0; i < pastedData.length; i++) {
        updatedValues[i] = pastedData[i];
      }
      setOtpValues(updatedValues);
      const nextFocusIndex = Math.min(pastedData.length, 5);
      otpInputsRef.current[nextFocusIndex]?.focus();
    }
  };

  const isOtpComplete = otpValues.join('').length === 6;

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <div className="flex flex-col items-center justify-center mb-4">
          <img src={logoSrc} alt="Logo" className="h-16 w-auto object-contain mb-2" />
          <span className="text-2xl font-bold gradient-text">Task Track</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {step === 'details' ? 'Create account' : 'Verify Email'}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {step === 'details' ? 'Join your team workspace' : `We've sent a 6-digit OTP code to ${form.email}`}
        </p>
      </div>

      <div className="glass rounded-2xl p-8">
        {step === 'details' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
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
                  Next: Verify Email
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                Enter 6-Digit OTP Code
              </label>

              {/* 6-box input design */}
              <div className="flex justify-center gap-3 mb-6">
                {otpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputsRef.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 rounded-xl text-center text-xl font-bold border focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all duration-200"
                    style={{
                      background: 'var(--bg-elevated)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-300 bg-red-500/10 border border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('details');
                  setError('');
                }}
                className="flex-1 py-3 rounded-xl btn-secondary font-semibold text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                id="otp-verify-submit"
                type="submit"
                disabled={loading || !isOtpComplete}
                className="flex-2 py-3 rounded-xl btn-primary font-semibold text-sm flex items-center justify-center gap-2"
                style={{ flexGrow: 2 }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify & Create Account
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              Didn&apos;t get the code?{' '}
              <button
                type="button"
                onClick={handleSendOtp}
                className="font-medium hover:underline text-violet-400"
              >
                Resend OTP
              </button>
            </p>
          </form>
        )}

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
