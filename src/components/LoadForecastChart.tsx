/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Clock, Loader2 } from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../utils/healthIndex';
import { ApiError, transbanApi } from '../services/api';
import { mapForecastSeries, readPage } from '../services/mappers';

interface LoadForecastChartProps {
  regionId: number;
  regionName?: string;
}

interface FeederOption {
  id: number;
  name: string;
}

const HORIZONS = [6, 12, 24, 48, 72];

interface ChartPoint {
  timeFa: string;
  actualLoadMw: number | null;
  predictedLoadMw: number;
  upperConfidenceMw: number;
  lowerConfidenceMw: number;
  confidenceSpan: number;
}

function formatForecastTime(timestamp: string) {
  const match = timestamp.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/);
  if (!match) return toPersianDigits(timestamp);
  return toPersianDigits(`${match[2]}/${match[3]} ${match[4]}`);
}

function errorText(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

export const LoadForecastChart: React.FC<LoadForecastChartProps> = ({
  regionId,
  regionName = 'کل شبکه توزیع استان قزوین',
}) => {
  const [feeders, setFeeders] = useState<FeederOption[]>([]);
  const [feederId, setFeederId] = useState<number | null>(null);
  const [horizon, setHorizon] = useState(24);
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [modelName, setModelName] = useState('');
  const [feederName, setFeederName] = useState('');
  const [listStatus, setListStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setListStatus('loading');
    setError('');
    setFeederId(null);
    transbanApi.getFeeders(regionId, 100, controller.signal)
      .then((raw) => {
        if (controller.signal.aborted) return;
        const options = readPage<{ id?: number; feeder_id?: number; name?: string; feeder_name?: string }>(raw).items
          .map((item) => ({
            id: Number(item.id ?? item.feeder_id),
            name: String(item.name ?? item.feeder_name ?? ''),
          }))
          .filter((item) => Number.isInteger(item.id) && item.name);
        setFeeders(options);
        setFeederId(options[0]?.id ?? null);
        setListStatus(options.length ? 'ready' : 'empty');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setFeeders([]);
        setFeederId(null);
        setListStatus('error');
        setError(errorText(err, 'فهرست فیدرها دریافت نشد'));
      });
    return () => controller.abort();
  }, [regionId]);

  useEffect(() => {
    if (listStatus !== 'ready' || feederId == null) return;
    const controller = new AbortController();
    setStatus('loading');
    setError('');
    transbanApi.getLoadForecast(regionId, feederId, horizon, controller.signal)
      .then((forecast) => {
        if (controller.signal.aborted) return;
        const series = mapForecastSeries(forecast).map((point, index) => ({
          ...point,
          timeFa: formatForecastTime(forecast.forecast_data[index]?.timestamp || point.timeFa),
          confidenceSpan: Math.max(0, point.upperConfidenceMw - point.lowerConfidenceMw),
        }));
        setPoints(series);
        setModelName(forecast.model_name || '');
        setFeederName(forecast.feeder_name || '');
        setStatus(series.length ? 'ready' : 'empty');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setPoints([]);
        setStatus('error');
        setError(errorText(err, 'پیش‌بینی بار فیدر دریافت نشد'));
      });
    return () => controller.abort();
  }, [regionId, feederId, horizon, listStatus]);

  const peak = points.reduce((max, point) => Math.max(max, point.predictedLoadMw || 0), 0);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-[#1e2230] bg-white dark:bg-[#11131a] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:border-slate-300 dark:hover:border-white/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              منحنی بار و پیش‌بینی {toPersianDigits(horizon)} ساعته
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            بار واقعی، پیش‌بینی و بازه اطمینان ۹۵٪ ({feederName || regionName})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            aria-label="انتخاب فیدر"
            value={feederId ?? ''}
            disabled={listStatus !== 'ready'}
            onChange={(event) => setFeederId(Number(event.target.value))}
            className="h-9 max-w-[220px] rounded-xl border border-slate-300 bg-white px-2 text-slate-800 outline-none focus:border-cyan-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {feeders.map((feeder) => (
              <option key={feeder.id} value={feeder.id}>{feeder.name}</option>
            ))}
          </select>
          <select
            aria-label="افق زمانی پیش‌بینی"
            value={horizon}
            onChange={(event) => setHorizon(Number(event.target.value))}
            className="h-9 rounded-xl border border-slate-300 bg-white px-2 text-slate-800 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {HORIZONS.map((hours) => (
              <option key={hours} value={hours}>{toPersianDigits(hours)} ساعت</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
          <span>بار واقعی</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-emerald-400 bg-emerald-500/20" />
          <span>پیش‌بینی</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400/40" />
          <span>بازه اطمینان</span>
        </div>
      </div>

      <div className="relative h-72 w-full pt-3">
        {(listStatus === 'loading' || status === 'loading') && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال دریافت پیش‌بینی بار...
          </div>
        )}
        {listStatus === 'error' || status === 'error' ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-xs text-rose-400">{error}</div>
        ) : listStatus === 'empty' ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">فیدری برای این امور ثبت نشده است.</div>
        ) : status === 'empty' ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">برای این فیدر و افق زمانی نقطه‌ای ثبت نشده است.</div>
        ) : status === 'ready' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualLoadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="predictedLoadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.12} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="timeFa"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                interval={Math.max(0, Math.ceil(points.length / 8) - 1)}
                axisLine={{ stroke: '#334155', opacity: 0.5 }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                width={42}
                axisLine={{ stroke: '#334155', opacity: 0.5 }}
                tickFormatter={(val) => toPersianDigits(Number(val).toFixed(1))}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as ChartPoint;
                  return (
                    <div className="rounded-xl border border-white/10 bg-slate-50 dark:bg-slate-900/80 p-3 text-right text-xs shadow-xl backdrop-blur-xl">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{label}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {row.actualLoadMw != null && (
                          <div className="flex items-center justify-between gap-4 text-cyan-400">
                            <span>بار واقعی:</span>
                            <span className="font-mono font-bold">{formatPersianNumber(row.actualLoadMw, 3)} MW</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-4 text-emerald-400">
                          <span>پیش‌بینی:</span>
                          <span className="font-mono font-bold">{formatPersianNumber(row.predictedLoadMw, 3)} MW</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[10px] text-slate-500 dark:text-slate-400">
                          <span>بازه اطمینان:</span>
                          <span className="font-mono">
                            {formatPersianNumber(row.lowerConfidenceMw, 3)} الی {formatPersianNumber(row.upperConfidenceMw, 3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="lowerConfidenceMw" stackId="band" stroke="transparent" fill="transparent" />
              <Area type="monotone" dataKey="confidenceSpan" stackId="band" stroke="transparent" fill="url(#confidenceGrad)" />
              <Area
                type="monotone"
                dataKey="predictedLoadMw"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="url(#predictedLoadGrad)"
              />
              <Area
                type="monotone"
                dataKey="actualLoadMw"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fill="url(#actualLoadGrad)"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-2 text-xs dark:bg-slate-900/60">
        <span className="text-slate-600 dark:text-slate-300">
          {modelName ? `مدل ${modelName}` : 'مدل پیش‌بینی دیسپاچینگ'}
          {peak > 0 ? ` · پیک پیش‌بینی ${formatPersianNumber(peak, 3)} مگاوات` : ''}
        </span>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{toPersianDigits(points.length)} نقطه</span>
      </div>
    </div>
  );
};
