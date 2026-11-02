/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  AlertTriangle, 
  Moon, 
  Sun, 
  MapPin, 
  Radio, 
  UserCheck, 
  Menu
} from 'lucide-react';
import { Region } from '../data/qazvinGridData';
import { toPersianDigits } from '../utils/healthIndex';

interface TopBarProps {
  regions: Region[];
  selectedRegionId: string;
  onSelectRegion: (id: string) => void;
  criticalAlertCount: number;
  onOpenAlertDrawer: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
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
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 bg-white/95 px-3 sm:px-4 backdrop-blur-md transition-colors dark:border-slate-800/80 dark:bg-[#0B0F19]/95 md:px-6">
      <div className="flex h-full items-center justify-between gap-2 sm:gap-4">
        
        {/* Right side (RTL Start): Logo, Brand & Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            aria-label="تغییر وضعیت منوی کناری"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/20 shrink-0">
              <span className="font-mono text-lg sm:text-xl font-black text-white">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-base md:text-lg whitespace-nowrap">
                  سامانه ترانسبان
                </span>
                <span className="hidden sm:inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  نسخه ۴٫۲
                </span>
              </div>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 md:block">
                شرکت توزیع نیروی برق استان قزوین
              </p>
            </div>
          </div>
        </div>

        {/* Center: Regional Selector Dropdown */}
        <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[150px] sm:max-w-[240px] md:max-w-none">
          <div className="relative flex items-center w-full min-w-0">
            <MapPin className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 sm:right-3 sm:h-4 sm:w-4" />
            <select
              value={selectedRegionId}
              onChange={(e) => onSelectRegion(e.target.value)}
              aria-label="انتخاب امور برق استان قزوین"
              className="h-9 sm:h-10 w-full truncate rounded-xl border border-slate-200 bg-slate-50 pr-7 pl-2 sm:pr-9 sm:pl-4 text-xs font-medium text-slate-800 transition-colors focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200 md:text-sm"
            >
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Telemetry Status */}
          <div className="hidden items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 lg:flex shrink-0">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span className="font-medium whitespace-nowrap">پایش زنده دیسپاچینگ</span>
          </div>
        </div>

        {/* Left side (RTL End): Alert Drawer Button, Dark Mode & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Critical Alert Drawer Button */}
          <button
            onClick={onOpenAlertDrawer}
            aria-label="هشدار‌های بحرانی ترانسفورماتورها"
            className="relative flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2 sm:px-3 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-500/20 dark:text-rose-400"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden md:inline whitespace-nowrap">هشدارهای بحرانی</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 font-mono text-[11px] font-bold text-white shadow-sm">
              {toPersianDigits(criticalAlertCount)}
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {/* User Profile Summary */}
          <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pr-3 text-right dark:border-slate-800 dark:bg-slate-900/90 xl:flex">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                مهندس سیدرضا حسینی
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                دیسپاچینگ و بهره‌برداری
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
