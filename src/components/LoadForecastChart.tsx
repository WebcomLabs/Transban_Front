/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Clock, Sparkles } from 'lucide-react';
import { HOURLY_LOAD_CURVE, LoadDataPoint } from '../data/qazvinGridData';
import { toPersianDigits, formatPersianNumber } from '../utils/healthIndex';

interface LoadForecastChartProps {
  data?: LoadDataPoint[];
  regionName?: string;
}

export const LoadForecastChart: React.FC<LoadForecastChartProps> = ({
  data = HOURLY_LOAD_CURVE,
  regionName = 'کل شبکه توزیع استان قزوین',
}) => {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800/80 dark:bg-[#111827]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              منحنی بار لحظه‌ای و پیش‌بینی هوشمند ۲۴ ساعته
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            تلفیق داده‌های کنتورهای فهام (MDM) و مدل یادگیری ماشین دیسپاچینگ ({regionName})
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
            <span>بار واقعی فهام (مگاوات)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-full border border-dashed border-emerald-400 bg-emerald-500/20" />
            <span>پیش‌بینی بار هوش مصنوعی</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-72 w-full pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="actualLoadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="predictedLoadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#64748b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey="timeFa"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155', opacity: 0.5 }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155', opacity: 0.5 }}
              tickFormatter={(val) => toPersianDigits(val)}
              domain={[300, 650]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const actual = payload.find((p) => p.dataKey === 'actualLoadMw')?.value;
                  const predicted = payload.find((p) => p.dataKey === 'predictedLoadMw')?.value;
                  const upper = payload.find((p) => p.dataKey === 'upperConfidenceMw')?.value;
                  const lower = payload.find((p) => p.dataKey === 'lowerConfidenceMw')?.value;

                  return (
                    <div className="rounded-xl border border-slate-700 bg-[#111827] p-3 text-right text-xs shadow-xl backdrop-blur-md">
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        <span>ساعت: {label}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {actual !== null && actual !== undefined && (
                          <div className="flex items-center justify-between gap-4 text-cyan-400">
                            <span>بار لحظه‌ای واقعی:</span>
                            <span className="font-mono font-bold">{toPersianDigits(Number(actual))} MW</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-4 text-emerald-400">
                          <span>پیش‌بینی بار هوش مصنوعی:</span>
                          <span className="font-mono font-bold">{toPersianDigits(Number(predicted))} MW</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-400 text-[10px]">
                          <span>بازه اطمینان (۹۵٪):</span>
                          <span className="font-mono">
                            {toPersianDigits(Number(lower))} الی {toPersianDigits(Number(upper))} MW
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Confidence Band */}
            <Area
              type="monotone"
              dataKey="upperConfidenceMw"
              stroke="transparent"
              fill="url(#confidenceGrad)"
            />

            {/* AI Predicted Load Area */}
            <Area
              type="monotone"
              dataKey="predictedLoadMw"
              name="پیش‌بینی هوش مصنوعی"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#predictedLoadGrad)"
            />

            {/* Actual Load Area */}
            <Area
              type="monotone"
              dataKey="actualLoadMw"
              name="بار واقعی فهام"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#actualLoadGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Insight */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-2 text-xs dark:bg-slate-900/60">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>اوپتیمایزر بار: پیش‌بینی پیک مصرف شب در ساعت ۲۰:۱۵ با بیشینه ۶۰۵ مگاوات (ضریب دقت ۹۸٫۴٪)</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">محدوده ایمن خط انتقال: ۶۲۰ MW</span>
      </div>
    </div>
  );
};
