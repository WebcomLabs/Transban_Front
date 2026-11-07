/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Bell,
  Moon, 
  Sun, 
  MapPin, 
  Radio, 
  UserCheck, 
  Menu,
  LogOut,
} from 'lucide-react';
import { Region } from '../data/qazvinGridData';
import { toPersianDigits } from '../utils/healthIndex';
import { ApiError, transbanApi } from '../services/api';
import type { UserResponse } from '../services/types';

interface TopBarProps {
  regions: Region[];
  selectedRegionId: string;
  onSelectRegion: (id: string) => void;
  criticalAlertCount: number;
  onOpenAlertDrawer: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  regions,
  selectedRegionId,
  onSelectRegion,
  criticalAlertCount,
  onOpenAlertDrawer,
  isDarkMode,
  onToggleDarkMode,
  onToggleSidebar,
  onLogout,
}) => {
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [userStatus, setUserStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    setUserStatus('loading');
    transbanApi.getCurrentUser(controller.signal)
      .then((user) => {
        if (controller.signal.aborted) return;
        setCurrentUser(user);
        setUserStatus('ready');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          onLogout();
          return;
        }
        setCurrentUser(null);
        setUserStatus('error');
      });
    return () => controller.abort();
  }, [onLogout]);

  const allowedRegionText = currentUser
    ? formatAllowedRegions(currentUser.allowed_regions, regions)
    : '';

  return (
    <header className="sticky top-0 z-30 h-11 w-full border-b border-[#1e2230] bg-[#090a0f] px-3">
      <div className="flex h-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onToggleSidebar}
            aria-label="تغییر وضعیت منوی کناری"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-slate-100 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-sm text-emerald-400">⚡</span>
          <span className="truncate text-sm font-semibold text-slate-100">سامانه ترانسبان</span>
          <span className="hidden text-[10px] text-slate-500 sm:inline">۴٫۲</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
          <div className="relative flex w-full min-w-0 max-w-[220px] items-center">
            <MapPin className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 text-slate-500" />
            <select
              value={selectedRegionId}
              onChange={(e) => onSelectRegion(e.target.value)}
              aria-label="انتخاب امور برق استان قزوین"
              className="h-7 w-full truncate rounded-lg bg-transparent pr-6 pl-1 text-xs text-slate-300 outline-none transition hover:bg-white/5 focus:bg-white/5"
            >
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden shrink-0 items-center gap-1.5 text-[11px] text-emerald-400/80 lg:flex">
            <Radio className="h-3 w-3" />
            <span className="whitespace-nowrap">پایش زنده</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={onOpenAlertDrawer}
            aria-label="هشدارهای خوانده‌نشده دیسپاچینگ"
            className="flex h-7 items-center gap-1 rounded-lg px-1.5 text-[11px] text-rose-300 transition hover:bg-rose-500/10"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="font-medium">{toPersianDigits(criticalAlertCount)}</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-300" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <div className="hidden max-w-[180px] items-center gap-1.5 px-1.5 text-right md:flex">
            <UserCheck className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <div className="min-w-0">
              <div className="truncate text-[11px] text-slate-200">
                {userStatus === 'loading' ? 'در حال دریافت...' : currentUser?.full_name || 'کاربر سامانه'}
              </div>
              <div className="truncate text-[10px] text-slate-500">
                {userStatus === 'error'
                  ? 'مشخصات کاربر در دسترس نیست'
                  : currentUser
                    ? `${currentUser.role} · ${allowedRegionText}`
                    : 'نقش و محدوده مجاز'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            aria-label="خروج از سامانه"
            className="flex h-7 items-center gap-1 rounded-lg px-1.5 text-[11px] text-slate-400 transition hover:bg-white/5 hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};

function formatAllowedRegions(ids: number[], regions: Region[]): string {
  if (!ids.length) return 'بدون محدوده مجاز';
  return ids
    .map((id) => regions.find((region) => region.id === String(id))?.name ?? `امور ${toPersianDigits(id)}`)
    .join('، ');
}
