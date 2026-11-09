import React, { useState } from 'react';
import { Loader2, LockKeyhole, LogIn, UserRound } from 'lucide-react';
import { ApiError, transbanApi } from '../services/api';

interface LoginPageProps {
  onSuccess: () => void;
}

function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403 || err.status === 400 || err.status === 422) {
      return 'نام کاربری یا رمز عبور نادرست است';
    }
    if (err.status >= 500) return 'خطای سرور هنگام ورود. کمی بعد دوباره تلاش کنید';
    return 'ورود انجام نشد. اطلاعات را بررسی کنید';
  }
  return 'ارتباط با سرور احراز هویت برقرار نشد';
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user = username.trim();
    if (!user || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const session = await transbanApi.login({ username: user, password });
      if (!session?.access_token) {
        setError('پاسخ سرور شامل توکن ورود نبود');
        return;
      }
      onSuccess();
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 dark:bg-[#0B0F19] px-4 py-10 text-slate-800 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(8,145,178,0.14),_transparent_36%)]" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#1e2230] bg-white dark:bg-[#11131a] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:border-slate-300 dark:hover:border-white/20 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/20">
            <span className="text-2xl font-black text-slate-800 dark:text-white">⚡</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">سامانه ترانسبان</h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">ورود به مرکز دیسپاچینگ توزیع برق قزوین</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">نام کاربری</span>
            <span className="relative block">
              <UserRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoFocus
                disabled={loading}
                className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/70 pr-10 pl-3 text-sm text-slate-800 dark:text-slate-100 outline-none transition focus:border-emerald-500 disabled:opacity-60"
                placeholder="نام کاربری سازمانی"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">رمز عبور</span>
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={loading}
                className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/70 pr-10 pl-3 text-sm text-slate-800 dark:text-slate-100 outline-none transition focus:border-emerald-500 disabled:opacity-60"
                placeholder="رمز عبور"
              />
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs leading-6 text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {loading ? 'در حال ورود...' : 'ورود به سامانه'}
          </button>
        </form>
      </div>
    </div>
  );
}
