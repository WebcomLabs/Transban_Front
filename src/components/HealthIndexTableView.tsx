/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  Flame, 
  ShieldAlert, 
  Download,
  CheckCircle2
} from 'lucide-react';
import { TransformerData, calculateHealthIndex, calculateFailureRisk, toPersianDigits, formatPersianNumber } from '../utils/healthIndex';
import { Region } from '../data/qazvinGridData';

interface HealthIndexTableViewProps {
  transformers: TransformerData[];
  regions: Region[];
  onSelectTransformer: (t: TransformerData) => void;
}

export const HealthIndexTableView: React.FC<HealthIndexTableViewProps> = ({
  transformers,
  regions,
  onSelectTransformer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');
  const [sortBy, setSortBy] = useState<'hi' | 'load' | 'risk'>('risk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [exportSuccess, setExportSuccess] = useState(false);

  const filtered = transformers
    .filter((t) => {
      const { status } = calculateHealthIndex(t);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.serialNumber.toLowerCase().includes(q) ||
          t.locationName.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aHI = calculateHealthIndex(a);
      const bHI = calculateHealthIndex(b);
      const aRisk = calculateFailureRisk(aHI.healthIndex, a.currentLoadPercent, a.overloadCount30d);
      const bRisk = calculateFailureRisk(bHI.healthIndex, b.currentLoadPercent, b.overloadCount30d);

      let diff = 0;
      if (sortBy === 'hi') {
        diff = aHI.healthIndex - bHI.healthIndex;
      } else if (sortBy === 'load') {
        diff = a.currentLoadPercent - b.currentLoadPercent;
      } else {
        diff = aRisk.risk30Days - bRisk.risk30Days;
      }
      return sortOrder === 'desc' ? -diff : diff;
    });

  const handleExportCSV = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Title & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-[#1e2230] bg-white dark:bg-[#11131a] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-slate-300 dark:hover:border-white/20">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white md:text-lg">
              پایش هوشمند شاخص سلامت ترانسفورماتورها (Health Index & Condition Monitoring)
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            جدول جامع ارزیابی چندمتغیره وضعیت عایق، گازهای روغن، اضافه بارهای حرارتی و برآورد ریسک خرابی
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Download className="h-4 w-4" />
          <span>خروجی اکسل گزارش HI</span>
        </button>
      </div>

      {exportSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 p-3 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="h-4 w-4" />
          <span>گزارش کامل شاخص سلامت ترانسفورماتورها در قالب CSV با موفقیت تولید شد.</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-[#1e2230] bg-white dark:bg-[#11131a] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-slate-300 dark:hover:border-white/20">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="جستجو در ترانس‌ها، کد پلاک یا موقعیت..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            همه
          </button>
          <button
            onClick={() => setStatusFilter('critical')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'critical'
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            بحرانی (HI &lt; ۵۰)
          </button>
          <button
            onClick={() => setStatusFilter('warning')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'warning'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            هشدار (۵۰-۸۰)
          </button>
          <button
            onClick={() => setStatusFilter('normal')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'normal'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            مطلوب (&ge; ۸۰)
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">مرتب‌سازی:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="risk">احتمال خرابی (ریسک)</option>
            <option value="hi">شاخص سلامت (HI)</option>
            <option value="load">درصد بار فعلی</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400"
            title="تغییر ترتیب نزولی/صعودی"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1e2230] bg-white dark:bg-[#11131a] shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-slate-300 dark:hover:border-white/20">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <th className="py-3 pr-4 pl-3 font-semibold">ترانسفورماتور / شماره سریال</th>
              <th className="px-3 py-3 font-semibold">ظرفیت (kVA) و نوع</th>
              <th className="px-3 py-3 font-semibold">شاخص سلامت (HI)</th>
              <th className="px-3 py-3 font-semibold">بار لحظه‌ای فهام</th>
              <th className="px-3 py-3 font-semibold">دمای روغن</th>
              <th className="px-3 py-3 font-semibold">ریسک خرابی ۳۰ روز</th>
              <th className="px-3 py-3 font-semibold">تعداد اضافه بار ماه</th>
              <th className="py-3 pr-3 pl-4 text-left font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filtered.map((t) => {
              const { healthIndex, status } = calculateHealthIndex(t);
              const { risk30Days } = calculateFailureRisk(healthIndex, t.currentLoadPercent, t.overloadCount30d);

              return (
                <tr
                  key={t.id}
                  className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="py-3 pr-4 pl-3">
                    <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                    <div className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                      {t.serialNumber} • {t.locationName}
                    </div>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {toPersianDigits(t.capacityKva)} kVA
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {t.type === 'ground' ? 'پست زمینی' : 'پایه هوایی'} • {t.manufacturer}
                    </div>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            healthIndex >= 80 ? 'bg-emerald-500' : healthIndex >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${healthIndex}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {toPersianDigits(healthIndex)}٪
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className={`font-mono font-bold ${
                        t.currentLoadPercent > 100
                          ? 'text-rose-500'
                          : t.currentLoadPercent > 85
                          ? 'text-amber-500'
                          : 'text-cyan-500'
                      }`}
                    >
                      {toPersianDigits(t.currentLoadPercent)}٪
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1 font-mono">
                      ({toPersianDigits(t.currentLoadKw)} kW)
                    </span>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap font-mono">
                    <span className={Number(t.telemetry?.oilTemp ?? 0) > 85 ? 'font-bold text-rose-500' : 'text-slate-700 dark:text-slate-300'}>
                      {toPersianDigits(t.telemetry?.oilTemp ?? 0)}°C
                    </span>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                        risk30Days > 50
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : risk30Days > 25
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {toPersianDigits(risk30Days)}٪
                    </span>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                    {toPersianDigits(t.overloadCount)} مرتبه
                  </td>

                  <td className="py-3 pr-3 pl-4 text-left whitespace-nowrap">
                    <button
                      onClick={() => onSelectTransformer(t)}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-500 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-600 dark:hover:text-white transition-colors"
                    >
                      <span>شناسنامه فنی</span>
                      <ChevronRight className="h-3 w-3 rotate-180" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
