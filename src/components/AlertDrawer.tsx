/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, BellRing, Loader2 } from 'lucide-react';
import { toPersianDigits } from '../utils/healthIndex';
import type { DispatchingAlertResponse } from '../services/types';

interface AlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: DispatchingAlertResponse[];
  status: 'loading' | 'ready' | 'error';
  error: string;
  acknowledgingId: number | null;
  onAcknowledge: (alertId: number) => void;
  onSelectAsset?: (assetId: number) => void;
}

export const AlertDrawer: React.FC<AlertDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  status,
  error,
  acknowledgingId,
  onAcknowledge,
  onSelectAsset,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 left-0 z-[9999] flex w-full max-w-md flex-col border-r border-[#1e2230] bg-[#090a0f] text-right">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                هشدارهای فعال دیسپاچینگ
              </h3>
              <p className="text-[11px] text-slate-500">
                {toPersianDigits(alerts.length)} هشدار خوانده‌نشده
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره هشدارها"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {status === 'loading' && alerts.length === 0 && (
            <p className="py-12 text-center text-xs text-slate-400">در حال دریافت هشدارهای دیسپاچینگ...</p>
          )}
          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
              {error}
            </p>
          )}
          {status !== 'loading' && !error && alerts.length === 0 && (
            <p className="py-12 text-center text-xs text-slate-400">هشدار فعال تاییدنشده‌ای وجود ندارد.</p>
          )}
          {alerts.map((alert) => {
            const pending = acknowledgingId === alert.id;
            return (
              <div
                key={alert.id}
                className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 dark:bg-rose-950/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{alert.alert_type}</div>
                    <div className="mt-1 text-[11px] leading-5 text-slate-600 dark:text-slate-300">{alert.message}</div>
                  </div>
                  <span className="shrink-0 rounded bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    #{toPersianDigits(alert.id)}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-slate-500">
                  {alert.asset_type} {toPersianDigits(alert.asset_id)} · {toPersianDigits(alert.created_at)}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-rose-500/20 pt-2.5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onAcknowledge(alert.id)}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {pending ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> در حال ثبت...
                      </span>
                    ) : 'رویت شد'}
                  </button>
                  {onSelectAsset && (
                    <button
                      type="button"
                      onClick={() => onSelectAsset(alert.asset_id)}
                      className="text-xs font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400"
                    >
                      مشاهده تجهیز
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
          {status === 'loading' && alerts.length > 0 ? 'در حال به‌روزرسانی فهرست هشدارها...' : 'هشدارهای تاییدنشده دیسپاچینگ'}
        </div>
      </div>
    </>
  );
};
