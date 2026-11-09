import React, { useState } from 'react';
import { AlertCircle, Clock, CheckCircle2, Filter } from 'lucide-react';
import { DefectStatusType, transbanApi } from '../services/api';
import { mapDefects } from '../services/mappers';

interface DefectStreamTableProps {
  defects: any[];
  onSelectTransformerId: (id: string) => void;
  onOpenNewDefectModal: () => void;
  onDefectsUpdated?: (newDefects: any[]) => void;
}

export const DefectStreamTable: React.FC<DefectStreamTableProps> = ({
  defects,
  onSelectTransformerId,
  onOpenNewDefectModal,
  onDefectsUpdated,
}) => {
  const [currentFilter, setCurrentFilter] = useState<DefectStatusType>('تعمیر نشده');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFilterChange = async (status: DefectStatusType) => {
    setCurrentFilter(status);
    setLoading(true);
    try {
      const res = await transbanApi.getDefectsByStatus(status, 50);
      if (onDefectsUpdated) {
        onDefectsUpdated(mapDefects(res));
      }
    } catch (e) {
      console.warn('خطا در فیلتر عیوب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#1e2230] bg-white dark:bg-[#11131a] shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-slate-300 dark:hover:border-white/20 p-5 shadow-xl space-y-4" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-amber-400" size={20} />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">کارتابل پایش عیوب و حوادث نت (PM)</h3>
        </div>

        {/* فیلترهای رسمی برگرفته از Swagger */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => handleFilterChange('تعمیر نشده')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${currentFilter === 'تعمیر نشده' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            تعمیر نشده
          </button>
          <button
            onClick={() => handleFilterChange('در انتظار تایید ناظر عالی')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${currentFilter === 'در انتظار تایید ناظر عالی' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            در انتظار تایید
          </button>
          <button
            onClick={() => handleFilterChange('تعمیر شده')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${currentFilter === 'تعمیر شده' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            تعمیر شده
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">شناسه</th>
              <th className="py-3 px-4">تجهیز / ترانس</th>
              <th className="py-3 px-4">منطقه</th>
              <th className="py-3 px-4">نوع عیب</th>
              <th className="py-3 px-4">اکیپ اجرایی</th>
              <th className="py-3 px-4">تاریخ ثبت</th>
              <th className="py-3 px-4">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6 text-slate-500 dark:text-slate-400">در حال دریافت اطلاعات از سرور...</td></tr>
            ) : defects.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6 text-slate-500 dark:text-slate-400">هیچ موردی با این وضعیت ثبت نشده است.</td></tr>
            ) : (
              defects.map((defect) => (
                <tr key={defect.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{defect.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-white cursor-pointer hover:text-cyan-400" onClick={() => onSelectTransformerId(defect.id)}>
                    {defect.transformerName}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{defect.regionName}</td>
                  <td className="py-3 px-4">{defect.category}</td>
                  <td className="py-3 px-4 text-cyan-300/80">{defect.assignedTeam}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{defect.reportedDate}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${defect.severityLabel === 'تعمیر نشده' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : defect.severityLabel === 'تعمیر شده' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                      {defect.severityLabel}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
