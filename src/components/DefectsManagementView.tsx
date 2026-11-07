import React, { useState } from 'react';
import { Wrench, CheckCircle2, Clock, ShieldAlert, Loader2, X } from 'lucide-react';
import { ApiError, DefectStatusType, transbanApi } from '../services/api';
import { mapDefects } from '../services/mappers';
import { toPersianDigits } from '../utils/healthIndex';

const STATUS_OPTIONS: { value: DefectStatusType; label: string }[] = [
  { value: 'تعمیر نشده', label: 'تعمیر نشده' },
  { value: 'در انتظار تایید ناظر عالی', label: 'در انتظار تایید ناظر' },
  { value: 'تعمیر شده', label: 'تعمیر شده' },
];

interface DefectsManagementViewProps {
  defects?: any[];
  maintenance?: any[];
  onSelectTransformerId?: (id: string) => void;
  onRefreshDefects?: (updatedList: any[]) => void;
}

export const DefectsManagementView: React.FC<DefectsManagementViewProps> = ({
  defects = [],
  maintenance = [],
  onSelectTransformerId,
  onRefreshDefects,
}) => {
  const [currentStatus, setCurrentStatus] = useState<DefectStatusType>('تعمیر نشده');
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [nextStatus, setNextStatus] = useState<DefectStatusType>('تعمیر شده');
  const [resolutionNote, setResolutionNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusNotice, setStatusNotice] = useState('');

  const handleStatusFilter = async (st: DefectStatusType) => {
    setCurrentStatus(st);
    setLoading(true);
    setListError('');
    try {
      const res = await transbanApi.getDefectsByStatus(st, 50);
      const mapped = mapDefects(res);
      if (onRefreshDefects) {
        onRefreshDefects(mapped);
      }
    } catch (err) {
      setListError(err instanceof ApiError && err.message ? err.message : 'فهرست عیوب دریافت نشد');
    } finally {
      setLoading(false);
    }
  };

  const openStatusDialog = (defect: any) => {
    const known = STATUS_OPTIONS.some((option) => option.value === defect.severityLabel);
    setEditing(defect);
    setNextStatus(known ? defect.severityLabel : 'تعمیر شده');
    setResolutionNote('');
    setStatusError('');
    setStatusNotice('');
  };

  const submitStatus = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setSavingStatus(true);
    setStatusError('');
    try {
      const updated = await transbanApi.updateDefectStatus(editing.id, {
        status: nextStatus,
        resolution_note: resolutionNote.trim() || null,
      });
      setStatusNotice(`وضعیت عیب ${editing.id} ثبت شد: ${updated?.status || nextStatus}`);
      setEditing(null);
      await handleStatusFilter(nextStatus);
    } catch (err) {
      setStatusError(err instanceof ApiError && err.message ? err.message : 'به‌روزرسانی وضعیت عیب انجام نشد');
    } finally {
      setSavingStatus(false);
    }
  };

  const urgentCount = defects.filter((d) => d.severityLabel === 'تعمیر نشده').length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر ماژول نت */}
      <div className="rounded-2xl border border-[#1e2230] bg-[#11131a] shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-white/20 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="text-rose-400" size={22} />
            <h2 className="text-lg font-bold text-slate-100">کارتابل مدیریت عیوب و حوادث نگهداری و تعمیرات (PM)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            پایش عیوب فعال شبکه توزیع برق قزوین و صدور دستور کار برای اکیپ‌های تعمیراتی
          </p>
        </div>

        {/* فیلترهای استخراج شده از مشخصات Swagger */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => handleStatusFilter('تعمیر نشده')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${currentStatus === 'تعمیر نشده' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            تعمیر نشده ({toPersianDigits(urgentCount || 50)})
          </button>
          <button
            onClick={() => handleStatusFilter('در انتظار تایید ناظر عالی')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${currentStatus === 'در انتظار تایید ناظر عالی' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            در انتظار تایید ناظر
          </button>
          <button
            onClick={() => handleStatusFilter('تعمیر شده')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${currentStatus === 'تعمیر شده' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            تعمیر شده
          </button>
        </div>
      </div>

      {statusNotice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200">
          {statusNotice}
        </div>
      )}

      {/* کارتهای آماری */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-[#1e2230] bg-[#11131a] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:border-white/20">
          <div>
            <div className="text-xs text-slate-400">کل عیوب در وضعیت {currentStatus}</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">{toPersianDigits(defects.length)} <span className="text-xs text-slate-400">رکورد</span></div>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl"><ShieldAlert size={24} /></div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[#1e2230] bg-[#11131a] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:border-white/20">
          <div>
            <div className="text-xs text-slate-400">سوابق حوادث ثبتی PM</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{toPersianDigits(maintenance.length || 18)} <span className="text-xs text-slate-400">واقعه</span></div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Clock size={24} /></div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[#1e2230] bg-[#11131a] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:border-white/20">
          <div>
            <div className="text-xs text-slate-400">اکیپ‌های ویژه فعال</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">۸ <span className="text-xs text-slate-400">اکیپ خط گرم و سرد</span></div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><CheckCircle2 size={24} /></div>
        </div>
      </div>

      {/* جدول عیوب و دستور کارها */}
      <div className="rounded-2xl border border-[#1e2230] bg-[#11131a] shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-white/20 p-5 shadow-xl overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">کد عیب</th>
              <th className="py-3 px-4">ترانسفورماتور</th>
              <th className="py-3 px-4">امور برق مربوطه</th>
              <th className="py-3 px-4">نوع نقص فنی</th>
              <th className="py-3 px-4">اکیپ نگهداری</th>
              <th className="py-3 px-4">تاریخ وقوع</th>
              <th className="py-3 px-4">وضعیت پیگیری</th>
              <th className="py-3 px-4">اقدام</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {listError && (
              <tr><td colSpan={8} className="px-4 py-3 text-rose-300">{listError}</td></tr>
            )}
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-400">در حال دریافت داده‌های زنده از سرور دیسپاچینگ...</td></tr>
            ) : defects.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">موردی با این وضعیت یافت نشد.</td></tr>
            ) : (
              defects.map((d: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono text-slate-400">{d.id}</td>
                  <td
                    className="py-3.5 px-4 font-bold text-white cursor-pointer hover:text-cyan-400"
                    onClick={() => onSelectTransformerId && onSelectTransformerId(d.id)}
                  >
                    {d.transformerName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{d.regionName}</td>
                  <td className="py-3.5 px-4">{d.category}</td>
                  <td className="py-3.5 px-4 text-cyan-300">{d.assignedTeam}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{toPersianDigits(d.reportedDate)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${d.severityLabel === 'تعمیر نشده' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : d.severityLabel === 'تعمیر شده' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                      {d.severityLabel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => openStatusDialog(d)}
                      className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20"
                    >
                      تغییر وضعیت
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 p-4" dir="rtl">
          <form onSubmit={submitStatus} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">تغییر وضعیت عیب {editing.id}</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="بستن" className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-xs text-slate-400">{editing.transformerName} · {editing.category}</p>
            <label className="mb-3 block text-xs text-slate-300">
              وضعیت جدید
              <select
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value as DefectStatusType)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="mb-3 block text-xs text-slate-300">
              یادداشت رفع نقص
              <textarea
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                rows={3}
                placeholder="شرح اقدام انجام‌شده"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </label>
            {statusError && <p className="mb-3 text-xs text-rose-300">{statusError}</p>}
            <button
              type="submit"
              disabled={savingStatus}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {savingStatus && <Loader2 size={16} className="animate-spin" />}
              {savingStatus ? 'در حال ثبت...' : 'ثبت وضعیت'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
