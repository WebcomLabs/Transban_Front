/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wrench, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  Plus, 
  X,
  FileCheck2,
  HardHat,
  Filter
} from 'lucide-react';
import { DefectStreamTable } from './DefectStreamTable';
import { DefectItem, DEFECTS_STREAM, RAW_TRANSFORMERS } from '../data/qazvinGridData';
import { toPersianDigits, formatPersianNumber } from '../utils/healthIndex';

interface DefectsManagementViewProps {
  onSelectTransformerId: (id: string) => void;
}

export const DefectsManagementView: React.FC<DefectsManagementViewProps> = ({
  onSelectTransformerId,
}) => {
  const [defects, setDefects] = useState<DefectItem[]>(DEFECTS_STREAM);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDefect, setNewDefect] = useState({
    transformerId: RAW_TRANSFORMERS[0].id,
    category: 'حرارتی' as DefectItem['category'],
    severity: 'urgent' as DefectItem['severity'],
    description: '',
    assignedTeam: 'اکیپ ویژه دیسپاچینگ و خط گرم',
  });
  const [formError, setFormError] = useState('');

  const urgentCount = defects.filter((d) => d.severity === 'urgent').length;
  const inProgressCount = defects.filter((d) => d.severity === 'in_progress').length;
  const resolvedCount = defects.filter((d) => d.severity === 'resolved').length;

  const handleSubmitNewDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDefect.description.trim()) {
      setFormError('لطفاً شرح نقص فنی و گزارش بازرسی را وارد نمایید.');
      return;
    }

    const targetT = RAW_TRANSFORMERS.find((t) => t.id === newDefect.transformerId) || RAW_TRANSFORMERS[0];

    const created: DefectItem = {
      id: `DEF-1403-${Math.floor(8900 + Math.random() * 1000)}`,
      transformerId: targetT.id,
      transformerName: targetT.name,
      serialNumber: targetT.serialNumber,
      regionName: 'امور توزیع برق مربوطه',
      category: newDefect.category,
      severity: newDefect.severity,
      severityLabel: newDefect.severity === 'urgent' ? 'فوری' : newDefect.severity === 'in_progress' ? 'در دست اقدام' : 'رفع شده',
      description: newDefect.description,
      reportedDate: '۱۴۰۳/۰۹/۱۴ - هم‌اکنون',
      assignedTeam: newDefect.assignedTeam,
      estimatedResolutionHours: newDefect.severity === 'urgent' ? 4 : 24,
    };

    setDefects([created, ...defects]);
    setIsModalOpen(false);
    setNewDefect({
      transformerId: RAW_TRANSFORMERS[0].id,
      category: 'حرارتی',
      severity: 'urgent',
      description: '',
      assignedTeam: 'اکیپ ویژه دیسپاچینگ و خط گرم',
    });
    setFormError('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800/80 dark:bg-[#111827]">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white md:text-lg">
              مدیریت عیوب و حوادث نگهداری و تعمیرات (PM / CM Subsystem)
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            کارتابل ارجاع حوادث، پایش وضعیت ترانسفورماتورها و ارسال خودکار دستور کار به اکیپ‌های تعمیراتی توزیع برق قزوین
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>ثبت عیب و صدور دستور کار جدید</span>
        </button>
      </div>

      {/* Maintenance Performance Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-rose-500/30 bg-white p-4 dark:border-rose-500/25 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">عیوب فوری در صف اقدام</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-500">
              <AlertOctagon className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-rose-600 dark:text-rose-400">
            {toPersianDigits(urgentCount)} مورد
          </div>
          <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
            نیازمند اعزام اکیپ کمتر از ۴ ساعت
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-white p-4 dark:border-amber-500/25 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">در حال تعمیر و رسیدگی</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-amber-600 dark:text-amber-400">
            {toPersianDigits(inProgressCount)} مورد
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            تحت بررسی توسط ۵ اکیپ خط گرم و رله
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">میانگین زمان رفع عیب (MTTR)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
              <HardHat className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-slate-900 dark:text-white">
            {toPersianDigits(3.8)} <span className="text-sm font-normal text-slate-400">ساعت</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            کاهش ۳۵ درصدی زمان خاموشی ناخواسته
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-white p-4 dark:border-emerald-500/25 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">نرخ انطباق نت پیشگیرانه</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {toPersianDigits(94.8)}٪
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            اجرای ۱٬۲۴۰ برنامه بازدید و تست دوره‌ای
          </div>
        </div>
      </div>

      {/* Stream Table Component */}
      <DefectStreamTable
        defects={defects}
        onSelectTransformerId={onSelectTransformerId}
        onOpenNewDefectModal={() => setIsModalOpen(true)}
      />

      {/* New Defect Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#111827] text-right">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  ثبت نقص فنی جدید و صدور دستور کار PM
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewDefect} className="mt-4 space-y-4 text-xs">
              {formError && (
                <div className="rounded-xl bg-rose-500/15 p-2.5 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  انتخاب ترانسفورماتور دارای نقص:
                </label>
                <select
                  value={newDefect.transformerId}
                  onChange={(e) => setNewDefect({ ...newDefect, transformerId: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  {RAW_TRANSFORMERS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.serialNumber}) - {toPersianDigits(t.capacityKva)} kVA
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    دسته‌بندی عیب:
                  </label>
                  <select
                    value={newDefect.category}
                    onChange={(e) => setNewDefect({ ...newDefect, category: e.target.value as any })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="حرارتی">حرارتی و گرمای بیش از حد</option>
                    <option value="نشتی روغن">نشتی روغن و درزبندی</option>
                    <option value="الکتریکی">الکتریکی و عایقی</option>
                    <option value="بوشینگ">بوشینگ و مقره‌ها</option>
                    <option value="اضافه بار">اضافه بار مداوم</option>
                    <option value="مکانیکی">مکانیکی و بدنه</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    درجه اولویت:
                  </label>
                  <select
                    value={newDefect.severity}
                    onChange={(e) => setNewDefect({ ...newDefect, severity: e.target.value as any })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="urgent">فوری (اعزام اضطراری)</option>
                    <option value="in_progress">در دست اقدام (پایش ۲۴ ساعته)</option>
                    <option value="resolved">رفع شده (ثبت سابقه)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  اکیپ مسئول رسیدگی:
                </label>
                <input
                  type="text"
                  value={newDefect.assignedTeam}
                  onChange={(e) => setNewDefect({ ...newDefect, assignedTeam: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  شرح کامل گزارش بازرسی و اقدامات مورد نیاز:
                </label>
                <textarea
                  rows={3}
                  value={newDefect.description}
                  onChange={(e) => setNewDefect({ ...newDefect, description: e.target.value })}
                  placeholder="مثال: افزایش دمای بوشینگ سمت فشار ضعیف تا ۸۵ درجه سانتی‌گراد و شل بودن مهره‌های کلمپ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                >
                  تایید و صدور دستور کار
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};
