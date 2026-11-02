/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ShieldAlert, Info } from 'lucide-react';
import { TransformerData, calculateHealthIndex, toPersianDigits } from '../utils/healthIndex';

interface HealthIndexPieChartProps {
  transformers: TransformerData[];
}

export const HealthIndexPieChart: React.FC<HealthIndexPieChartProps> = ({ transformers }) => {
  let normalCount = 0;
  let warningCount = 0;
  let criticalCount = 0;

  transformers.forEach((t) => {
    const { status } = calculateHealthIndex(t);
    if (status === 'critical') criticalCount++;
    else if (status === 'warning') warningCount++;
    else normalCount++;
  });

  const total = transformers.length || 1;
  const normalPercent = Math.round((normalCount / total) * 100);
  const warningPercent = Math.round((warningCount / total) * 100);
  const criticalPercent = Math.round((criticalCount / total) * 100);

  const data = [
    { name: 'مطلوب و سالم (HI ≥ ۸۰)', value: normalCount, percent: normalPercent, color: '#10b981' },
    { name: 'هشدار و پایش (۵۰ ≤ HI < ۸۰)', value: warningCount, percent: warningPercent, color: '#f59e0b' },
    { name: 'بحرانی و پرریسک (HI < ۵۰)', value: criticalCount, percent: criticalPercent, color: '#f43f5e' },
  ];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800/80 dark:bg-[#111827]">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              توزیع شاخص سلامت ترانس‌ها (HI)
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            مبنای استاندارد IEC 60422
          </span>
        </div>
      </div>

      {/* Donut Chart with Center KPI */}
      <div className="relative flex h-52 w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-slate-700 bg-[#111827] p-2.5 text-right text-xs shadow-xl">
                      <div className="font-bold" style={{ color: item.color }}>
                        {item.name}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-slate-300">
                        <span>تعداد دستگاه:</span>
                        <span className="font-mono font-bold">{toPersianDigits(item.value)} ترانس</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-slate-300">
                        <span>سهم از کل ناوگان:</span>
                        <span className="font-mono font-bold">{toPersianDigits(item.percent)}٪</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text inside Donut */}
        <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
          <span className="font-mono text-xl font-black text-slate-900 dark:text-white">
            {toPersianDigits(transformers.length)}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            ترانس تحت پایش
          </span>
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div className="space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300">مطلوب و پایدار:</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{toPersianDigits(normalCount)} ترانس</span>
            <span className="text-slate-400">({toPersianDigits(normalPercent)}٪)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700 dark:text-slate-300">هشدار و نیازمند نت:</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-amber-600 dark:text-amber-400">{toPersianDigits(warningCount)} ترانس</span>
            <span className="text-slate-400">({toPersianDigits(warningPercent)}٪)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-700 dark:text-slate-300">بحرانی و ریسک بالا:</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-rose-600 dark:text-rose-400">{toPersianDigits(criticalCount)} ترانس</span>
            <span className="text-slate-400">({toPersianDigits(criticalPercent)}٪)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
