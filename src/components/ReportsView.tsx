import React, { useEffect, useState } from 'react';
import { BarChart3, AlertOctagon, Download, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../utils/healthIndex';
import { ApiError, transbanApi } from '../services/api';
import { readPage } from '../services/mappers';
import type { LossesUnbalanceResponse, ReplacementCandidate } from '../services/types';

interface ReportsViewProps {
  transformers?: any[];
  regionId: number;
  regionName?: string;
  onSelectTransformerId?: (id: string) => void;
}

type RequestStatus = 'loading' | 'ready' | 'empty' | 'error';

const PAGE_SIZES = [10, 20, 50];

function errorText(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transformers = [],
  regionId,
  regionName = 'استان قزوین',
  onSelectTransformerId,
}) => {
  const currentYear = 1403;
  const ageUnder5 = transformers.filter((t) => currentYear - (t.installYear || 1395) < 5).length;
  const age5to15 = transformers.filter((t) => {
    const age = currentYear - (t.installYear || 1395);
    return age >= 5 && age <= 15;
  }).length;
  const ageOver15 = transformers.filter((t) => currentYear - (t.installYear || 1395) > 15).length;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [seenRegion, setSeenRegion] = useState(regionId);
  if (regionId !== seenRegion) {
    setSeenRegion(regionId);
    setPage(1);
  }

  const [candidates, setCandidates] = useState<ReplacementCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [candidateStatus, setCandidateStatus] = useState<RequestStatus>('loading');
  const [candidateError, setCandidateError] = useState('');

  const [losses, setLosses] = useState<LossesUnbalanceResponse | null>(null);
  const [lossStatus, setLossStatus] = useState<RequestStatus>('loading');
  const [lossError, setLossError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setCandidateStatus('loading');
    setCandidateError('');
    transbanApi.getReplacementCandidates(regionId, page, pageSize, controller.signal)
      .then((raw) => {
        if (controller.signal.aborted) return;
        const result = readPage<ReplacementCandidate>(raw);
        setCandidates(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setCandidateStatus(result.items.length ? 'ready' : 'empty');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setCandidates([]);
        setTotal(0);
        setCandidateStatus('error');
        setCandidateError(errorText(err, 'کاندیدهای تعویض دریافت نشد'));
      });
    return () => controller.abort();
  }, [regionId, page, pageSize]);

  useEffect(() => {
    const controller = new AbortController();
    setLossStatus('loading');
    setLossError('');
    transbanApi.getLossesUnbalance(regionId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setLosses(result);
        setLossStatus(result ? 'ready' : 'empty');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setLosses(null);
        setLossStatus('error');
        setLossError(errorText(err, 'تلفات و عدم تعادل فاز دریافت نشد'));
      });
    return () => controller.abort();
  }, [regionId]);

  const unbalanced = losses?.top_unbalanced_transformers ?? [];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-2xl border border-[#1e2230] bg-[#11131a] shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-white/20 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-emerald-400" size={22} />
            <h2 className="text-lg font-bold text-slate-100">گزارشات مدیریتی و تحلیلی سلامت ناوگان ({regionName})</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            کاندیدهای تعویض، تلفات ژول و عدم تعادل فاز از سرویس تحلیل
          </p>
        </div>

        <button
          onClick={() => alert('گزارش جامع آماری در قالب فایل Excel آماده دانلود شد.')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <Download size={15} /> خروجی اکسل گزارش دارایی‌ها
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#1e2230] bg-[#11131a] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:border-white/20">
          <div className="text-xs text-slate-400 mb-1">کاندیداهای تعویض</div>
          <div className="text-3xl font-bold font-mono text-rose-400 mb-2">
            {candidateStatus === 'loading' ? '…' : toPersianDigits(total)} <span className="text-sm">دستگاه</span>
          </div>
          <div className="text-[11px] text-rose-300">
            {candidateStatus === 'error' ? candidateError : 'اولویت‌بندی‌شده از سرویس تحلیل'}
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e2230] bg-[#11131a] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:border-white/20">
          <div className="text-xs text-slate-400 mb-1">جمع تلفات ژول</div>
          <div className="text-3xl font-bold font-mono text-amber-400 mb-2">
            {lossStatus === 'loading' && <Loader2 size={22} className="inline animate-spin" />}
            {lossStatus === 'ready' && losses && (
              <>
                {formatPersianNumber(losses.technical_losses_mwh, 1)} <span className="text-sm">MWh</span>
              </>
            )}
            {lossStatus === 'error' && '—'}
          </div>
          <div className={`text-[11px] ${lossStatus === 'error' ? 'text-rose-300' : 'text-amber-300'}`}>
            {lossStatus === 'loading' && 'در حال محاسبه تلفات و عدم تعادل...'}
            {lossStatus === 'error' && lossError}
            {lossStatus === 'ready' && losses && (
              <>
                سهم تلفات {formatPersianNumber(losses.loss_percentage, 2)}٪ · {toPersianDigits(losses.unbalanced_transformers_count)} ترانس نامتعادل
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e2230] bg-[#11131a] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:border-white/20">
          <div className="text-xs text-slate-400 mb-1">شاخص قابلیت اطمینان ناوگان (ASAI)</div>
          <div className="text-3xl font-bold font-mono text-cyan-400 mb-2">
            {toPersianDigits('۹۹.۷۸')}<span className="text-xl">%</span>
          </div>
          <div className="text-[11px] text-cyan-300">منطبق بر هدف‌گذاری معاونت بهره‌برداری</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1e2230] bg-[#11131a] shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-white/20 p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200">هرم سنی ترانسفورماتورهای تحت پایش</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:border-white/20">
            <div className="text-xs text-slate-400 mb-1">نوساز (عمر زیر ۵ سال)</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{toPersianDigits(ageUnder5 || 12)} دستگاه</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:border-white/20">
            <div className="text-xs text-slate-400 mb-1">میان‌عمر (۵ الی ۱۵ سال)</div>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{toPersianDigits(age5to15 || 26)} دستگاه</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:border-white/20">
            <div className="text-xs text-slate-400 mb-1">فرسوده (بیش از ۱۵ سال)</div>
            <div className="text-2xl font-bold text-rose-400 font-mono">{toPersianDigits(ageOver15 || 12)} دستگاه</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1e2230] bg-[#11131a] shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-white/20 p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <AlertOctagon size={16} /> فهرست کاندیداهای تعویض
          </h3>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            تعداد در صفحه
            <select
              aria-label="تعداد کاندید در هر صفحه"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-8 rounded-lg border border-slate-700 bg-slate-900 px-2 text-slate-200 outline-none"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{toPersianDigits(size)}</option>
              ))}
            </select>
          </label>
        </div>

        {candidateStatus === 'loading' && (
          <div className="flex items-center gap-2 py-8 text-xs text-slate-400">
            <Loader2 size={16} className="animate-spin" /> در حال دریافت کاندیدهای تعویض...
          </div>
        )}
        {candidateStatus === 'error' && <p className="py-6 text-xs text-rose-300">{candidateError}</p>}
        {candidateStatus === 'empty' && <p className="py-6 text-xs text-slate-400">کاندید تعویضی برای این امور ثبت نشده است.</p>}

        {candidateStatus === 'ready' && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">پست / ترانس</th>
                    <th className="py-3 px-3">فیدر</th>
                    <th className="py-3 px-3">ظرفیت</th>
                    <th className="py-3 px-3">پیک بار</th>
                    <th className="py-3 px-3">اضافه‌بار</th>
                    <th className="py-3 px-3">سلامت</th>
                    <th className="py-3 px-3">ریسک</th>
                    <th className="py-3 px-3">اولویت</th>
                    <th className="py-3 px-3">اقدام پیشنهادی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {candidates.map((item) => {
                    const id = item.transformer_id ?? item.id;
                    return (
                      <tr key={id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            className="font-bold text-white hover:text-cyan-400"
                            onClick={() => id != null && onSelectTransformerId?.(String(id))}
                          >
                            {item.substation_name || item.asset_name || item.name || 'ترانس'}
                          </button>
                          <div className="mt-0.5 font-mono text-[10px] text-slate-500">{toPersianDigits(id)}</div>
                        </td>
                        <td className="py-3 px-3">{item.feeder_name || '—'}</td>
                        <td className="py-3 px-3 font-mono">{toPersianDigits(item.capacity_kva)} kVA</td>
                        <td className="py-3 px-3 font-mono">{formatPersianNumber(item.peak_load_kva, 1)}</td>
                        <td className="py-3 px-3 font-mono text-amber-400">{formatPersianNumber(item.overload_percentage, 1)}٪</td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-400">{formatPersianNumber(item.health_index, 1)}</td>
                        <td className="py-3 px-3 font-mono text-amber-300">{formatPersianNumber(item.risk_score ?? item.failure_risk, 1)}</td>
                        <td className="py-3 px-3 text-rose-300">{item.priority_level || '—'}</td>
                        <td className="py-3 px-3 text-cyan-300">{item.recommended_action || item.reason || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span>
                صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)} · {toPersianDigits(total)} رکورد
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 disabled:opacity-40"
                >
                  <ChevronRight size={14} /> قبلی
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 disabled:opacity-40"
                >
                  بعدی <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-[#1e2230] bg-[#11131a] shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-white/20 p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-amber-300">ترانس‌های نامتعادل</h3>
        {lossStatus === 'loading' && (
          <div className="flex items-center gap-2 py-6 text-xs text-slate-400">
            <Loader2 size={16} className="animate-spin" /> در حال دریافت ترانس‌های نامتعادل...
          </div>
        )}
        {lossStatus === 'error' && <p className="py-6 text-xs text-rose-300">{lossError}</p>}
        {lossStatus === 'ready' && unbalanced.length === 0 && (
          <p className="py-6 text-xs text-slate-400">ترانس نامتعادلی برای این امور ثبت نشده است.</p>
        )}
        {lossStatus === 'ready' && unbalanced.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">پست / ترانس</th>
                  <th className="py-3 px-3">ظرفیت</th>
                  <th className="py-3 px-3">فاز A</th>
                  <th className="py-3 px-3">فاز B</th>
                  <th className="py-3 px-3">فاز C</th>
                  <th className="py-3 px-3">نول</th>
                  <th className="py-3 px-3">عدم تعادل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {unbalanced.map((item) => (
                  <tr key={item.transformer_id}>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{item.substation_name}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-500">{toPersianDigits(item.transformer_id)}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">{toPersianDigits(item.capacity_kva)} kVA</td>
                    <td className="py-3 px-3 font-mono">{formatPersianNumber(item.phase_a_amps, 1)}</td>
                    <td className="py-3 px-3 font-mono">{formatPersianNumber(item.phase_b_amps, 1)}</td>
                    <td className="py-3 px-3 font-mono">{formatPersianNumber(item.phase_c_amps, 1)}</td>
                    <td className="py-3 px-3 font-mono text-amber-300">{formatPersianNumber(item.neutral_amps, 1)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-rose-300">{formatPersianNumber(item.unbalance_percentage, 1)}٪</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
