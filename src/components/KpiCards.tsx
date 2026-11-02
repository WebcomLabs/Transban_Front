/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Zap, 
  AlertOctagon, 
  Flame, 
  HeartPulse, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../utils/healthIndex';

interface KpiCardsProps {
  totalTransformers: number;
  criticalRiskCount: number;
  activeOverloadCount: number;
  averageHealthIndex: number;
  onFilterCriticalClick?: () => void;
  onFilterOverloadClick?: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalTransformers,
  criticalRiskCount,
  activeOverloadCount,
  averageHealthIndex,
  onFilterCriticalClick,
  onFilterOverloadClick,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      
      {/* 1. Total Transformers */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-slate-300 dark:border-slate-800/80 dark:bg-[#111827] dark:hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            کل ترانسفورماتورهای تحت پایش
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <Zap className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
            {formatPersianNumber(totalTransformers)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">دستگاه</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>پوشش ۱۰۰٪ تله‌متری فهام و GIS</span>
        </div>
      </div>

      {/* 2. Critical Failure Risk Transformers */}
      <div 
        onClick={onFilterCriticalClick}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-rose-500/30 bg-white p-4 shadow-xs transition-all hover:border-rose-500/60 hover:shadow-md hover:shadow-rose-500/5 dark:border-rose-500/25 dark:bg-[#111827] dark:hover:border-rose-500/50"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            ترانس‌های پرریسک / هشدار خرابی
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
            <AlertOctagon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400 md:text-3xl">
            {toPersianDigits(criticalRiskCount)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">نیازمند مداخله فوری</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>ریسک سوختگی در ۳۰ روز آینده &gt; ۶۰٪</span>
        </div>
        <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-l from-rose-500 to-amber-500" />
      </div>

      {/* 3. Active Repeated Overloads */}
      <div 
        onClick={onFilterOverloadClick}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-amber-500/30 bg-white p-4 shadow-xs transition-all hover:border-amber-500/60 hover:shadow-md hover:shadow-amber-500/5 dark:border-amber-500/25 dark:bg-[#111827] dark:hover:border-amber-500/50"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            اضافه بارهای تکراری فعال
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Flame className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 md:text-3xl">
            {toPersianDigits(activeOverloadCount)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">نقطه حرارتی فعال</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
          <TrendingDown className="h-3.5 w-3.5" />
          <span>بار بیش از ۱۰۰٪ نامی در ساعات اوج</span>
        </div>
        <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-l from-amber-500 to-yellow-400" />
      </div>

      {/* 4. Average Health Index */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-white p-4 shadow-xs transition-all hover:border-emerald-500/60 dark:border-emerald-500/25 dark:bg-[#111827] dark:hover:border-emerald-500/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            میانگین شاخص سلامت شبکه (HI)
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <HeartPulse className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 md:text-3xl">
            {toPersianDigits(averageHealthIndex.toFixed(1))}٪
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">وضعیت کلی پایدار</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <span>هدف شرکت: حفظ بالای ۷۵٪ بر پایه استاندارد IEC</span>
        </div>
        <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-l from-emerald-500 to-cyan-500" />
      </div>

    </div>
  );
};
