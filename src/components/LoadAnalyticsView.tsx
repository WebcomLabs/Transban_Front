/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Radio, 
  Cpu, 
  Zap, 
  Gauge, 
  BarChart2, 
  Clock, 
  Sliders, 
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { LoadForecastChart } from './LoadForecastChart';
import { FEEDERS, Feeder } from '../data/qazvinGridData';
import { toPersianDigits, formatPersianNumber } from '../utils/healthIndex';

export const LoadAnalyticsView: React.FC = () => {
  const [selectedFeederId, setSelectedFeederId] = useState<string>(FEEDERS[0].id);
  const [peakShavingSimActive, setPeakShavingSimActive] = useState<boolean>(false);

  const selectedFeeder = FEEDERS.find((f) => f.id === selectedFeederId) || FEEDERS[0];

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800/80 dark:bg-[#111827]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white md:text-lg">
                تحلیل بار و مصرف هوشمند فهام (Smart Metering & Load Analytics)
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              پایش بلادرنگ داده‌های کنتورهای طرح ملی فهام، مدیریت دیسپاچینگ، پیش‌بینی هوشمند پیک و تراز بار فیدرهای ۲۰ کیلوولت
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPeakShavingSimActive(!peakShavingSimActive)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                peakShavingSimActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{peakShavingSimActive ? 'شبیه‌سازی مدیریت بار فعال' : 'شبیه‌سازی پاسخگویی بار (DR)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Faham Subsystem KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">کنتورهای فهام فعال (MDM)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-slate-900 dark:text-white">
            {formatPersianNumber(38420)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            نرخ مخابره موفق: ۹۹٫۴٪ (پروتکل DLMS/COSEM)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">پیک مصرف لحظه‌ای استان</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-slate-900 dark:text-white">
            {toPersianDigits(605)} <span className="text-sm font-normal text-slate-400">MW</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            ظرفیت مجاز ایمن خطوط: ۶۲۰ مگاوات
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">ضریب بار شبکه (Load Factor)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Gauge className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {toPersianDigits(81.2)}٪
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            بهبود ۲٫۴٪ نسبت به دوره مشابه سال قبل
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">صرفه‌جویی با الگوریتم هوش</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-purple-600 dark:text-purple-400">
            {toPersianDigits(42.5)} <span className="text-sm font-normal text-slate-400">MW</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            کاهش تنش حرارتی روی ترانس‌های بحرانی
          </div>
        </div>
      </div>

      {/* Main Load Forecast Chart */}
      <LoadForecastChart regionName={selectedFeeder.name} />

      {/* Feeder Load Comparison Cards */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800/80 dark:bg-[#111827]">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          وضعیت بار و ترانسفورماتورهای فیدرهای ۲۰ کیلوولت منتخب قزوین
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEEDERS.map((feeder) => {
            const isSelected = selectedFeederId === feeder.id;
            const loadPercent = Math.round((feeder.currentLoadMw / feeder.peakLoadMw) * 100);

            return (
              <div
                key={feeder.id}
                onClick={() => setSelectedFeederId(feeder.id)}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-sm dark:bg-cyan-950/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {feeder.name}
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {feeder.code}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">بار لحظه‌ای فیدر:</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {toPersianDigits(feeder.currentLoadMw)} / {toPersianDigits(feeder.peakLoadMw)} MW
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      loadPercent > 90 ? 'bg-rose-500' : loadPercent > 75 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>تعداد ترانس متصل: {toPersianDigits(feeder.transformerCount)}</span>
                  <span>طول: {toPersianDigits(feeder.lengthKm)} km</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
