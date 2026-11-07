import React, { useState, useEffect } from 'react';
import { transbanApi } from '../services/api';
import { Activity, CheckCircle2, XCircle, RefreshCw, Database } from 'lucide-react';

interface EndpointStatus {
  name: string;
  method: string;
  url: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  count: number;
  dataSample?: any;
  error?: string;
  duration?: number;
}

export function ApiMonitorView() {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { name: 'لیست امورهای برق', method: 'GET', url: '/api/v1/regional/regions', status: 'idle', count: 0 },
    { name: 'نقشه و عوارض GIS', method: 'GET', url: '/api/v1/gis-map', status: 'idle', count: 0 },
    { name: 'پست‌های فوق توزیع', method: 'GET', url: '/api/v1/regional/substations', status: 'idle', count: 0 },
    { name: 'فیدرهای ۲۰ کیلوولت', method: 'GET', url: '/api/v1/regional/feeders', status: 'idle', count: 0 },
    { name: 'ترانسفورماتورها', method: 'GET', url: '/api/v1/regional/transformers', status: 'idle', count: 0 },
    { name: 'مشترکین و تعرفه‌ها', method: 'GET', url: '/api/v1/regional/customers', status: 'idle', count: 0 },
    { name: 'حوادث و نت (PM)', method: 'GET', url: '/api/v1/regional/maintenance', status: 'idle', count: 0 },
    { name: 'کنتورهای فهام (MDM)', method: 'GET', url: '/api/v1/regional/meter-readings', status: 'idle', count: 0 },
    { name: 'بار لحظه‌ای فیدرها', method: 'GET', url: '/api/v1/regional/feeder-loads', status: 'idle', count: 0 },
    { name: 'فیلتر عیوب فعال', method: 'GET', url: '/api/v1/defects/filter', status: 'idle', count: 0 },
  ]);

  const testAll = async () => {
    const callers = [
      transbanApi.getRegions,
      transbanApi.getGisMap,
      transbanApi.getSubstations,
      transbanApi.getFeeders,
      transbanApi.getTransformers,
      transbanApi.getCustomers,
      transbanApi.getMaintenance,
      transbanApi.getMeterReadings,
      transbanApi.getFeederLoads,
      () => transbanApi.getDefectsByStatus(),
    ];

    setEndpoints((prev) => prev.map((ep) => ({ ...ep, status: 'loading' })));

    callers.forEach(async (caller, idx) => {
      const t0 = performance.now();
      try {
        const res = await caller();
        const duration = Math.round(performance.now() - t0);
        const payload = res as { data?: unknown[]; features?: unknown[] } | unknown[] | null;
        const count = Array.isArray(payload)
          ? payload.length
          : (payload?.data?.length ?? payload?.features?.length ?? 1);
        setEndpoints((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], status: 'success', count, duration, dataSample: res };
          return next;
        });
      } catch (err: any) {
        const duration = Math.round(performance.now() - t0);
        setEndpoints((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], status: 'error', error: err.message, duration };
          return next;
        });
      }
    });
  };

  useEffect(() => {
    testAll();
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="text-cyan-400" /> وضعیت اتصال به ۱۰ وب‌سرویس بک‌اند (ترانسبان)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تست زنده دریافت داده از وب‌سرویس‌های OpenAPI توزیع برق قزوین
          </p>
        </div>
        <button
          onClick={testAll}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition"
        >
          <RefreshCw size={16} /> تست مجدد همه متدها
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {endpoints.map((ep, i) => (
          <div key={i} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold">
                  {ep.method}
                </span>
                <h3 className="text-sm font-bold text-slate-200 mt-1.5">{ep.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{ep.url}</p>
              </div>
              <div>
                {ep.status === 'loading' && <Activity className="text-amber-400 animate-spin" size={20} />}
                {ep.status === 'success' && <CheckCircle2 className="text-emerald-400" size={20} />}
                {ep.status === 'error' && <XCircle className="text-rose-400" size={20} />}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
              {ep.status === 'success' && (
                <>
                  <span className="text-emerald-400 font-medium">متصل شد ({ep.count} رکورد)</span>
                  <span className="text-slate-500 font-mono">{ep.duration}ms</span>
                </>
              )}
              {ep.status === 'error' && (
                <span className="text-rose-400 font-mono text-[11px] truncate max-w-[280px]" title={ep.error}>
                  {ep.error}
                </span>
              )}
              {ep.status === 'loading' && <span className="text-amber-400">در حال ارسال درخواست...</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
