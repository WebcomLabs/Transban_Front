/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  CheckCircle2,
  Zap,
  BarChart3
} from 'lucide-react';
import { RAW_TRANSFORMERS } from '../data/qazvinGridData';
import { calculateHealthIndex, calculateFailureRisk, toPersianDigits, formatPersianNumber } from '../utils/healthIndex';

export const ReportsView: React.FC = () => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Replacement candidates: HI < 60 or age > 20 with overloads
  const replacementCandidates = RAW_TRANSFORMERS.map((t) => {
    const { healthIndex } = calculateHealthIndex(t);
    const { risk30Days } = calculateFailureRisk(healthIndex, t.currentLoadPercent, t.overloadCount30d);
    const age = 2026 - t.installationYear;
    return {
      ...t,
      healthIndex,
      risk30Days,
      age,
    };
  }).filter((t) => t.healthIndex < 65 || t.age > 18)
    .sort((a, b) => a.healthIndex - b.healthIndex);

  const handleExport = (type: string) => {
    setDownloadSuccess(`گزارش ${type} با موفقیت تهیه شد و آماده بارگیری می‌باشد.`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800/80 dark:bg-[#111827]">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white md:text-lg">
              گزارشات تحلیلی و دوره‌ای مدیریت دارایی‌های فیزیکی (Asset Management)
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            برآورد عمر باقیمانده ناوگان ترانسفورماتورها، اولویت‌بندی تعویض، تلفات فنی انرژی و خروجی‌های مدیریتی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('جامع اکسل (CSV)')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-4 w-4" />
            <span>خروجی اکسل (CSV)</span>
          </button>
          <button
            onClick={() => handleExport('رسمی چاپی هیئت مدیره (PDF)')}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500"
          >
            <Printer className="h-4 w-4" />
            <span>چاپ گزارش مدیریتی</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 p-3 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Fleet Age & Technical Loss Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-[#111827]">
          <div className="text-xs text-slate-500">میانگین سن ترانس‌های استان</div>
          <div className="mt-2 font-mono text-2xl font-black text-slate-900 dark:text-white">
            {toPersianDigits(14.6)} <span className="text-sm font-normal text-slate-400">سال</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            ۴۲٪ ترانس‌ها بالای ۱۵ سال سن دارند
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-[#111827]">
          <div className="text-xs text-slate-500">تلفات فنی ناشی از اضافه بار تکراری</div>
          <div className="mt-2 font-mono text-2xl font-black text-amber-600 dark:text-amber-400">
            {toPersianDigits(1.85)} <span className="text-sm font-normal text-slate-400">GWh / سال</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            تلفات بی‌باری (هسته) و بارداری (مسی)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-[#111827]">
          <div className="text-xs text-slate-500">برآورد بودجه لازم نوسازی ناوگان</div>
          <div className="mt-2 font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {toPersianDigits(24.5)} <span className="text-sm font-normal text-slate-400">میلیارد تومان</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            برای تعویض و تعدیل بار ۲۷ دستگاه پرریسک
          </div>
        </div>
      </div>

      {/* Replacement Priority Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800/80 dark:bg-[#111827]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              فهرست اولویت‌بندی شده ترانسفورماتورهای کاندید تعویض و اورهال (Priority Action List)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              استخراج شده بر مبنای تلفیق شاخص سلامت (HI)، اضافه بارهای بحرانی و سنوات کارکرد
            </p>
          </div>
          <span className="rounded-lg bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
            {toPersianDigits(replacementCandidates.length)} دستگاه با اولویت فوری
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2.5 pr-2 font-semibold">رتبه اولویت</th>
                <th className="px-3 py-2.5 font-semibold">ترانسفورماتور</th>
                <th className="px-3 py-2.5 font-semibold">ظرفیت</th>
                <th className="px-3 py-2.5 font-semibold">سن تجهیز</th>
                <th className="px-3 py-2.5 font-semibold">شاخص سلامت</th>
                <th className="px-3 py-2.5 font-semibold">علت اصلی ریسک</th>
                <th className="px-3 py-2.5 font-semibold">اقدام پیشنهادی ترانسبان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {replacementCandidates.map((c, idx) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-2 whitespace-nowrap">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {toPersianDigits(idx + 1)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                    <div className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">{c.serialNumber}</div>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold whitespace-nowrap">
                    {toPersianDigits(c.capacityKva)} kVA
                  </td>
                  <td className="px-3 py-3 font-mono whitespace-nowrap">
                    {toPersianDigits(c.age)} سال (نصب {toPersianDigits(c.installationYear)})
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="font-mono font-bold text-rose-500">
                      {toPersianDigits(c.healthIndex)}٪
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                    {c.currentLoadPercent > 115
                      ? 'اضافه بار متوالی شدید و قوس الکتریکی DGA'
                      : 'فرسودگی روغن و اسیدیته بالا'}
                  </td>
                  <td className="px-3 py-3 text-emerald-600 dark:text-emerald-400 font-medium">
                    {c.currentLoadPercent > 115
                      ? 'ارتقای ظرفیت به ۱۰۰۰ kVA و بازتوزیع بار'
                      : 'تصفیه روغن و تعویض سیلیکاژل'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
