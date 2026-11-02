/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Wrench, 
  Search, 
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { DefectItem } from '../data/qazvinGridData';
import { toPersianDigits } from '../utils/healthIndex';

interface DefectStreamTableProps {
  defects: DefectItem[];
  onSelectTransformerId?: (transformerId: string) => void;
  onOpenNewDefectModal?: () => void;
}

export const DefectStreamTable: React.FC<DefectStreamTableProps> = ({
  defects,
  onSelectTransformerId,
  onOpenNewDefectModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDefects = defects.filter((item) => {
    if (statusFilter !== 'all' && item.severity !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.transformerName.toLowerCase().includes(q) ||
        item.serialNumber.toLowerCase().includes(q) ||
        item.regionName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (severity: DefectItem['severity']) => {
    switch (severity) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            فوری
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            در دست اقدام
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            رفع شده
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800/80 dark:bg-[#111827]">
      {/* Header and Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              کارتابل زنده عیوب و حوادث نت (PM)
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            فیلتر برخط وضعیت عیوب ترانس‌های توزیع مطابق متدولوژی نگهداری و تعمیرات
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              همه ({toPersianDigits(defects.length)})
            </button>
            <button
              onClick={() => setStatusFilter('urgent')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === 'urgent'
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              فوری ({toPersianDigits(defects.filter((d) => d.severity === 'urgent').length)})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === 'in_progress'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              در دست اقدام
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === 'resolved'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              رفع شده
            </button>
          </div>

          {/* New Defect Trigger */}
          {onOpenNewDefectModal && (
            <button
              onClick={onOpenNewDefectModal}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>ثبت عیب جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="جستجو بر اساس نام ترانس، شماره سریال، امور برق یا شرح نقص..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
          />
        </div>
      </div>

      {/* Table Data */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="py-2.5 pr-2 pl-3 font-semibold">شناسه / ترانسفورماتور</th>
              <th className="px-3 py-2.5 font-semibold">امور و دسته عیب</th>
              <th className="px-3 py-2.5 font-semibold">وضعیت</th>
              <th className="px-3 py-2.5 font-semibold">شرح نقص فنی و اقدامات</th>
              <th className="px-3 py-2.5 font-semibold">اکیپ مسئول</th>
              <th className="px-3 py-2.5 font-semibold">زمان ثبت</th>
              <th className="py-2.5 pr-3 pl-2 text-left font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredDefects.length > 0 ? (
              filteredDefects.map((defect) => (
                <tr
                  key={defect.id}
                  className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="py-3 pr-2 pl-3">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {defect.transformerName}
                    </div>
                    <div className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">
                      {defect.serialNumber}
                    </div>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="text-slate-800 dark:text-slate-300">{defect.regionName}</div>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {defect.category}
                    </span>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    {getSeverityBadge(defect.severity)}
                  </td>

                  <td className="px-3 py-3 max-w-xs text-slate-600 dark:text-slate-300">
                    <p className="line-clamp-2">{defect.description}</p>
                  </td>

                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {defect.assignedTeam}
                  </td>

                  <td className="px-3 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {defect.reportedDate}
                  </td>

                  <td className="py-3 pr-3 pl-2 text-left whitespace-nowrap">
                    {onSelectTransformerId && (
                      <button
                        onClick={() => onSelectTransformerId(defect.transformerId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors"
                      >
                        <span>پرونده</span>
                        <ChevronRight className="h-3 w-3 rotate-180" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  موردی با شرایط فیلتر انتخاب شده یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
