import React, { useEffect, useState } from 'react';
import {
  X, Activity, Droplets, Zap, Wrench, Thermometer, Gauge, AlertTriangle, CheckCircle2, Loader2,
} from 'lucide-react';
import {
  Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { TransformerData, calculateHealthIndex, toPersianDigits } from '../utils/healthIndex';
import { ApiError, transbanApi } from '../services/api';
import type { DgaTestCreate, DgaTestRecord, TelemetryPoint } from '../services/types';
import { mapDgaHistory } from '../services/mappers';

interface Props {
  isOpen?: boolean;
  transformer: TransformerData | null;
  onClose: () => void;
  onRegisterWorkOrder: (id: string, desc: string) => void;
}

const emptyDgaForm = {
  test_date: '',
  c2h2: '',
  c2h4: '',
  h2: '',
  ch4: '',
  co: '',
  breakdown_voltage_kv: '',
};

const emptyWorkOrder = {
  issue_type: '',
  assigned_team: '',
  priority: 'فوری',
  description: '',
};

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === 'AbortError';
}

function errorText(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

function axisTime(timestamp: string) {
  const clock = timestamp.match(/\d{1,2}:\d{2}/);
  return toPersianDigits(clock ? clock[0] : timestamp);
}

export function TransformerDetailModal({ isOpen = true, transformer, onClose, onRegisterWorkOrder }: Props) {
  const [activeTab, setActiveTab] = useState('summary');
  const [loadPoints, setLoadPoints] = useState<TelemetryPoint[]>([]);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loadError, setLoadError] = useState('');
  const [dgaHistory, setDgaHistory] = useState<DgaTestRecord[]>([]);
  const [dgaStatus, setDgaStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [dgaError, setDgaError] = useState('');
  const [dgaForm, setDgaForm] = useState(emptyDgaForm);
  const [dgaSaving, setDgaSaving] = useState(false);
  const [dgaNotice, setDgaNotice] = useState('');
  const [workOrderOpen, setWorkOrderOpen] = useState(false);
  const [workOrder, setWorkOrder] = useState(emptyWorkOrder);
  const [workSaving, setWorkSaving] = useState(false);
  const [workNotice, setWorkNotice] = useState('');

  const transformerId = transformer?.id;

  useEffect(() => {
    if (!isOpen || !transformerId) return;
    const controller = new AbortController();
    setLoadStatus('loading');
    setDgaStatus('loading');
    setLoadError('');
    setDgaError('');
    setDgaNotice('');
    setWorkNotice('');

    const load = async () => {
      try {
        const history = await transbanApi.getTransformerLoadHistory(transformerId, 24, controller.signal);
        if (controller.signal.aborted) return;
        setLoadPoints(history?.data ?? []);
        setLoadStatus('ready');
      } catch (err) {
        if (controller.signal.aborted || isAbort(err)) return;
        setLoadPoints([]);
        setLoadStatus('error');
        setLoadError(errorText(err, 'نمودار ۲۴ ساعته از سرور دریافت نشد'));
      }

      try {
        const history = await transbanApi.getDgaHistory(transformerId, controller.signal);
        if (controller.signal.aborted) return;
        setDgaHistory(mapDgaHistory(history));
        setDgaStatus('ready');
      } catch (err) {
        if (controller.signal.aborted || isAbort(err)) return;
        setDgaHistory([]);
        setDgaStatus('error');
        setDgaError(errorText(err, 'تاریخچه آزمون روغن از سرور دریافت نشد'));
      }
    };

    void load();
    return () => controller.abort();
  }, [isOpen, transformerId]);

  if (!isOpen || !transformer) return null;

  const { status, healthIndex } = calculateHealthIndex(transformer);
  const currentYear = 1403;
  const installYear = Number(transformer.installYear) || 1395;
  const age = Math.max(0, currentYear - installYear);
  const dga = transformer.dgaGases;
  const tel = transformer.telemetry;
  const latestDga = dgaHistory[dgaHistory.length - 1];

  const statusColors = {
    healthy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
  const statusLabels = { healthy: 'مطلوب', warning: 'هشدار', critical: 'بحرانی' };

  const loadChart = loadPoints.map((point) => ({
    time: axisTime(point.timestamp),
    loadKw: point.load_kw,
    currentAmps: point.current_amps,
    oilC: point.oil_temperature_c,
  }));

  const dgaChart = dgaHistory.map((row, index) => ({
    label: toPersianDigits(row.test_date || String(index + 1)),
    c2h2: row.c2h2,
    c2h4: row.c2h4,
    h2: row.h2,
    ch4: row.ch4,
    co: row.co,
    breakdown: row.breakdown_voltage_kv,
  }));

  const gasCards = [
    { label: 'استیلن (C2H2)', value: latestDga?.c2h2 ?? dga?.c2h2, limit: 2 },
    { label: 'اتیلن (C2H4)', value: latestDga?.c2h4 ?? dga?.c2h4, limit: 50 },
    { label: 'هیدروژن (H2)', value: latestDga?.h2 ?? dga?.h2, limit: 100 },
    { label: 'متان (CH4)', value: latestDga?.ch4 ?? dga?.ch4, limit: 120 },
    { label: 'مونوکسید (CO)', value: latestDga?.co ?? dga?.co, limit: 350 },
  ];

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const refreshDga = async () => {
    const history = await transbanApi.getDgaHistory(transformer.id);
    setDgaHistory(mapDgaHistory(history));
    setDgaStatus('ready');
    setDgaError('');
  };

  const submitDga = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body: DgaTestCreate = {
      test_date: dgaForm.test_date.trim(),
      c2h2: Number(dgaForm.c2h2),
      c2h4: Number(dgaForm.c2h4),
      h2: Number(dgaForm.h2),
      ch4: Number(dgaForm.ch4),
      co: Number(dgaForm.co),
      breakdown_voltage_kv: Number(dgaForm.breakdown_voltage_kv),
    };
    const numbers = [body.c2h2, body.c2h4, body.h2, body.ch4, body.co, body.breakdown_voltage_kv];
    if (!body.test_date || numbers.some((value) => !Number.isFinite(value))) {
      setDgaNotice('تاریخ آزمون، هر پنج گاز و ولتاژ شکست را کامل وارد کنید');
      return;
    }

    setDgaSaving(true);
    setDgaNotice('');
    try {
      await transbanApi.createDgaTest(transformer.id, body);
      setDgaForm(emptyDgaForm);
      setDgaNotice('آزمون روغن ثبت شد');
      await refreshDga();
    } catch (err) {
      setDgaNotice(errorText(err, 'ثبت آزمون روغن انجام نشد'));
    } finally {
      setDgaSaving(false);
    }
  };

  const submitWorkOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const transformerNumericId = Number(transformer.id);
    if (!workOrder.issue_type.trim() || !workOrder.assigned_team.trim()) {
      setWorkNotice('نوع عیب و اکیپ تعمیرات را وارد کنید');
      return;
    }
    if (!Number.isInteger(transformerNumericId)) {
      setWorkNotice('شناسه این ترانس عددی نیست و دستور کار به سرور ارسال نمی‌شود');
      return;
    }

    setWorkSaving(true);
    setWorkNotice('');
    try {
      await transbanApi.createWorkOrder({
        transformer_id: transformerNumericId,
        issue_type: workOrder.issue_type.trim(),
        assigned_team: workOrder.assigned_team.trim(),
        priority: workOrder.priority,
        description: workOrder.description.trim() || null,
      });
      onRegisterWorkOrder(transformer.id, workOrder.description.trim() || workOrder.issue_type.trim());
      setWorkOrder(emptyWorkOrder);
      setWorkNotice('دستور کار اضطراری ثبت شد');
    } catch (err) {
      setWorkNotice(errorText(err, 'صدور دستور کار انجام نشد'));
    } finally {
      setWorkSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      dir="rtl"
    >
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[#1e2230] bg-[#11131a]">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Zap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-100">{transformer.name}</h2>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${statusColors[status]}`}>
                  {statusLabels[status]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                <span>سریال: <span className="font-mono text-slate-300">{toPersianDigits(transformer.serialNumber)}</span></span>
                <span>•</span>
                <span>ظرفیت: <span className="font-mono text-slate-300">{toPersianDigits(transformer.capacityKva)} kVA</span></span>
                <span>•</span>
                <span>منطقه: {transformer.region || '—'}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800/80 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all cursor-pointer border border-slate-700 hover:border-rose-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-6 px-6 border-b border-slate-800 bg-slate-900/40">
          <button type="button" onClick={() => setActiveTab('summary')} className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'summary' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            <Activity size={16} /> خلاصه وضعیت و پیش‌بینی
          </button>
          <button type="button" onClick={() => setActiveTab('dga')} className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'dga' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            <Droplets size={16} /> آنالیز گازهای محلول (DGA)
          </button>
          <button type="button" onClick={() => setActiveTab('telemetry')} className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'telemetry' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            <Gauge size={16} /> تله‌متری زنده فهام
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'summary' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 shadow-inner">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-slate-300">شاخص سلامت (HI)</span>
                    <span className="text-xs text-slate-500">از ۱۰۰</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-3 font-mono">{toPersianDigits(healthIndex)}</div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${status === 'healthy' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${healthIndex}%` }} />
                  </div>
                  <div className="text-xs text-slate-400">وضعیت فنی کلی: <span className="font-bold">{statusLabels[status]}</span></div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 shadow-inner">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-slate-300">احتمال خرابی ۳۰ روزه</span>
                    <span className="text-xs text-slate-500">هوش مصنوعی</span>
                  </div>
                  <div className="text-4xl font-bold text-amber-400 mb-3 font-mono">
                    {toPersianDigits(transformer.failureRisk30d)}<span className="text-xl">%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${transformer.failureRisk30d}%` }} />
                  </div>
                  <div className="text-xs text-slate-400">احتمال خرابی در ۹۰ روز: {toPersianDigits(Math.min(99, transformer.failureRisk30d * 1.5))}%</div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 shadow-inner">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-slate-300">بار لحظه‌ای ترانس</span>
                    <span className="text-xs text-slate-500">MDM فهام</span>
                  </div>
                  <div className={`text-4xl font-bold mb-3 font-mono ${transformer.currentLoadPercent > 100 ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {toPersianDigits(transformer.currentLoadPercent)}<span className="text-xl">%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${transformer.currentLoadPercent > 100 ? 'bg-rose-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, transformer.currentLoadPercent)}%` }} />
                  </div>
                  <div className="text-xs text-slate-400">پیک ۲۴ ساعت گذشته: {toPersianDigits(Math.round(transformer.currentLoadPercent * 1.1))}%</div>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 shadow-inner">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Wrench size={16} className="text-slate-400" /> شناسنامه فنی و پلاک
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">سال نصب و راه‌اندازی:</div>
                    <div className="font-bold text-slate-200">{toPersianDigits(installYear)} <span className="text-amber-400/80 text-[11px]">(عمر: {toPersianDigits(age)} سال)</span></div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">نسبت تبدیل ولتاژ:</div>
                    <div className="font-bold text-cyan-300 font-mono text-left w-max" dir="ltr">20 kV / 400 V</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">تعداد اضافه بار مکرر:</div>
                    <div className="font-bold text-slate-200 flex items-center gap-1">
                      <span className={`text-lg px-1.5 rounded ${transformer.overloadCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'text-emerald-400'}`}>
                        {transformer.overloadCount === 0 ? 'صفر' : toPersianDigits(transformer.overloadCount)}
                      </span>
                      <span className="text-[11px] text-slate-500">مرتبه</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">آخرین پایش روغن (PM):</div>
                    <div className="font-bold text-slate-200 font-mono">{toPersianDigits(transformer.lastMaintenanceDate)}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'dga' && (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="text-amber-400 shrink-0" size={20} />
                <div className="text-sm text-amber-200/80 leading-relaxed">
                  روند گازهای محلول و ولتاژ شکست از تاریخچهٔ آزمایشگاه روغن خوانده می‌شود. آخرین رکورد در کارت‌ها و کل روند در نمودار و جدول پایین است.
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {gasCards.map((gas) => {
                  const value = Number(gas.value ?? 0);
                  const color = value > gas.limit * 2 ? 'text-rose-400' : value > gas.limit ? 'text-amber-400' : 'text-emerald-400';
                  return (
                    <div key={gas.label} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center shadow-sm">
                      <div className="text-xs text-slate-400 mb-2 font-mono" dir="ltr">{gas.label}</div>
                      <div className={`text-2xl font-bold font-mono mb-1 ${color}`}>{toPersianDigits(value)}</div>
                      <div className="text-[10px] text-slate-500">حد مجاز: {toPersianDigits(gas.limit)} ppm</div>
                    </div>
                  );
                })}
              </div>

              {latestDga && (
                <div className="text-xs text-slate-400">
                  ولتاژ شکست آخرین آزمون: <span className="font-mono text-sky-300">{toPersianDigits(latestDga.breakdown_voltage_kv)} kV</span>
                  {latestDga.test_date ? ` · تاریخ ${toPersianDigits(latestDga.test_date)}` : ''}
                </div>
              )}

              {dgaStatus === 'loading' && <p className="text-xs text-slate-400">در حال دریافت تاریخچه DGA...</p>}
              {dgaStatus === 'error' && <p className="text-xs text-rose-300">{dgaError}</p>}
              {dgaStatus === 'ready' && dgaChart.length === 0 && (
                <p className="text-xs text-slate-400">برای این ترانس آزمون روغن ثبت نشده است.</p>
              )}

              {dgaChart.length > 0 && (
                <div className="h-72 rounded-2xl border border-slate-700/50 bg-slate-900/40 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dgaChart} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis yAxisId="ppm" stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(value) => toPersianDigits(value)} />
                      <YAxis yAxisId="kv" orientation="right" stroke="#38bdf8" fontSize={11} tickLine={false} tickFormatter={(value) => toPersianDigits(value)} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, direction: 'rtl' }} />
                      <Legend />
                      <Line yAxisId="ppm" type="monotone" dataKey="c2h2" name="C2H2" stroke="#fb7185" dot={false} strokeWidth={2} />
                      <Line yAxisId="ppm" type="monotone" dataKey="c2h4" name="C2H4" stroke="#fbbf24" dot={false} strokeWidth={2} />
                      <Line yAxisId="ppm" type="monotone" dataKey="h2" name="H2" stroke="#22d3ee" dot={false} strokeWidth={2} />
                      <Line yAxisId="ppm" type="monotone" dataKey="ch4" name="CH4" stroke="#34d399" dot={false} strokeWidth={2} />
                      <Line yAxisId="ppm" type="monotone" dataKey="co" name="CO" stroke="#a78bfa" dot={false} strokeWidth={2} />
                      <Line yAxisId="kv" type="monotone" dataKey="breakdown" name="ولتاژ شکست kV" stroke="#38bdf8" strokeDasharray="4 4" dot={false} strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {dgaHistory.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/80 text-slate-400">
                      <tr>
                        <th className="px-3 py-2">تاریخ</th>
                        <th className="px-3 py-2">C2H2</th>
                        <th className="px-3 py-2">C2H4</th>
                        <th className="px-3 py-2">H2</th>
                        <th className="px-3 py-2">CH4</th>
                        <th className="px-3 py-2">CO</th>
                        <th className="px-3 py-2">ولتاژ شکست</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dgaHistory.map((row, index) => (
                        <tr key={`${row.test_date}-${index}`} className="border-t border-slate-800 text-slate-200 font-mono">
                          <td className="px-3 py-2">{toPersianDigits(row.test_date)}</td>
                          <td className="px-3 py-2">{toPersianDigits(row.c2h2)}</td>
                          <td className="px-3 py-2">{toPersianDigits(row.c2h4)}</td>
                          <td className="px-3 py-2">{toPersianDigits(row.h2)}</td>
                          <td className="px-3 py-2">{toPersianDigits(row.ch4)}</td>
                          <td className="px-3 py-2">{toPersianDigits(row.co)}</td>
                          <td className="px-3 py-2">{toPersianDigits(row.breakdown_voltage_kv)} kV</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <form onSubmit={submitDga} className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-100">ثبت آزمون جدید آزمایشگاه روغن</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="تاریخ آزمون" value={dgaForm.test_date} onChange={(value) => setDgaForm({ ...dgaForm, test_date: value })} placeholder="1405/08/11" />
                  <Field label="C2H2" value={dgaForm.c2h2} onChange={(value) => setDgaForm({ ...dgaForm, c2h2: value })} />
                  <Field label="C2H4" value={dgaForm.c2h4} onChange={(value) => setDgaForm({ ...dgaForm, c2h4: value })} />
                  <Field label="H2" value={dgaForm.h2} onChange={(value) => setDgaForm({ ...dgaForm, h2: value })} />
                  <Field label="CH4" value={dgaForm.ch4} onChange={(value) => setDgaForm({ ...dgaForm, ch4: value })} />
                  <Field label="CO" value={dgaForm.co} onChange={(value) => setDgaForm({ ...dgaForm, co: value })} />
                  <Field label="ولتاژ شکست (kV)" value={dgaForm.breakdown_voltage_kv} onChange={(value) => setDgaForm({ ...dgaForm, breakdown_voltage_kv: value })} />
                </div>
                {dgaNotice && (
                  <p className={`text-xs ${dgaNotice === 'آزمون روغن ثبت شد' ? 'text-emerald-300' : 'text-rose-300'}`}>{dgaNotice}</p>
                )}
                <button
                  type="submit"
                  disabled={dgaSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
                >
                  {dgaSaving && <Loader2 size={16} className="animate-spin" />}
                  {dgaSaving ? 'در حال ثبت...' : 'ثبت آزمون'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4">
                <h3 className="mb-3 text-sm font-bold text-slate-100">بار، جریان و دمای روغن ۲۴ ساعت گذشته</h3>
                {loadStatus === 'loading' && <p className="text-xs text-slate-400">در حال دریافت تله‌متری...</p>}
                {loadStatus === 'error' && <p className="text-xs text-rose-300">{loadError}</p>}
                {loadStatus === 'ready' && loadChart.length === 0 && (
                  <p className="text-xs text-slate-400">نقطه‌ای برای ۲۴ ساعت گذشته ثبت نشده است.</p>
                )}
                {loadChart.length > 0 && (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={loadChart} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} minTickGap={24} />
                        <YAxis yAxisId="power" stroke="#22d3ee" fontSize={11} tickLine={false} tickFormatter={(value) => toPersianDigits(value)} />
                        <YAxis yAxisId="temp" orientation="right" stroke="#fb7185" fontSize={11} tickLine={false} tickFormatter={(value) => toPersianDigits(value)} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, direction: 'rtl' }} />
                        <Legend />
                        <Area yAxisId="power" type="monotone" dataKey="loadKw" name="بار (kW)" stroke="#22d3ee" fill="#22d3ee33" />
                        <Line yAxisId="power" type="monotone" dataKey="currentAmps" name="جریان (A)" stroke="#34d399" dot={false} strokeWidth={2} />
                        <Line yAxisId="temp" type="monotone" dataKey="oilC" name="دمای روغن (°C)" stroke="#fb7185" dot={false} strokeWidth={2} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {tel && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2 border-b border-slate-700/50 pb-2">
                      <Zap size={16} /> ولتاژ فازها (V)
                    </h3>
                    <div className="space-y-3 font-mono text-sm">
                      <PhaseRow label="Phase R" value={tel.voltageR} />
                      <PhaseRow label="Phase S" value={tel.voltageS} />
                      <PhaseRow label="Phase T" value={tel.voltageT} />
                    </div>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2 border-b border-slate-700/50 pb-2">
                      <Activity size={16} /> جریان فازها (A)
                    </h3>
                    <div className="space-y-3 font-mono text-sm">
                      <PhaseRow label="Phase R" value={tel.currentR} />
                      <PhaseRow label="Phase S" value={tel.currentS} />
                      <PhaseRow label="Phase T" value={tel.currentT} />
                    </div>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><Thermometer size={24} /></div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">دمای روغن (Top Oil)</div>
                          <div className="font-bold text-slate-200 font-mono">{toPersianDigits(tel.oilTemp)} °C</div>
                        </div>
                      </div>
                      {tel.oilTemp > 85 ? <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded">داغ</span> : <CheckCircle2 className="text-emerald-500" size={20} />}
                    </div>
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg"><Gauge size={24} /></div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">ضریب توان (Power Factor)</div>
                          <div className="font-bold text-slate-200 font-mono">{toPersianDigits(tel.powerFactor)}</div>
                        </div>
                      </div>
                      {tel.powerFactor < 0.85 ? <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">خازن‌گذاری</span> : <CheckCircle2 className="text-emerald-500" size={20} />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {workOrderOpen && (
          <form onSubmit={submitWorkOrder} className="border-t border-slate-800 bg-slate-950/70 px-5 py-4 space-y-3">
            <h3 className="text-sm font-bold text-rose-200">صدور دستور کار اضطراری نت</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Field label="نوع عیب" value={workOrder.issue_type} onChange={(value) => setWorkOrder({ ...workOrder, issue_type: value })} placeholder="اضافه بار مکرر و داغی روغن" />
              <Field label="اکیپ" value={workOrder.assigned_team} onChange={(value) => setWorkOrder({ ...workOrder, assigned_team: value })} placeholder="اکیپ خط گرم شمال قزوین" />
              <label className="block text-xs text-slate-400">
                اولویت
                <select
                  value={workOrder.priority}
                  onChange={(event) => setWorkOrder({ ...workOrder, priority: event.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus:border-rose-500"
                >
                  <option value="فوری">فوری</option>
                  <option value="عادی">عادی</option>
                </select>
              </label>
              <Field label="شرح کار" value={workOrder.description} onChange={(value) => setWorkOrder({ ...workOrder, description: value })} placeholder="شرح اقدام مورد نیاز" />
            </div>
            {workNotice && (
              <p className={`text-xs ${workNotice === 'دستور کار اضطراری ثبت شد' ? 'text-emerald-300' : 'text-rose-300'}`}>{workNotice}</p>
            )}
            <button
              type="submit"
              disabled={workSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {workSaving && <Loader2 size={16} className="animate-spin" />}
              {workSaving ? 'در حال صدور...' : 'صدور دستور کار'}
            </button>
          </form>
        )}

        <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">شناسه یکتا: {transformer.id}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
            >
              بستن
            </button>
            <button
              type="button"
              onClick={() => setWorkOrderOpen((open) => !open)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.4)]"
            >
              <Wrench size={16} /> ثبت دستور کار نت
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs text-slate-400">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
      />
    </label>
  );
}

function PhaseRow({ label, value }: { label: string; value: number | string | undefined }) {
  return (
    <div className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-lg">
      <span className="text-slate-400">{label}</span>
      <span className="font-bold text-white">{toPersianDigits(value)}</span>
    </div>
  );
}
