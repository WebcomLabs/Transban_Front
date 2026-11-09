import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Gauge, Loader2, Radio, Zap } from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPersianNumber, toPersianDigits } from '../utils/healthIndex';
import { ApiError, transbanApi } from '../services/api';
import { readPage } from '../services/mappers';
import type {
  CustomerSchema,
  FeederLoadSchema,
  FeederSchema,
  MeterReadingSchema,
  TariffType,
} from '../services/types';

interface LoadAnalyticsViewProps {
  regionId: number;
  regionName?: string;
}

type RequestStatus = 'loading' | 'ready' | 'empty' | 'error';

const TARIFFS: Array<{ value: '' | TariffType; label: string }> = [
  { value: '', label: 'همه تعرفه‌ها' },
  { value: 'خانگی', label: 'خانگی' },
  { value: 'صنعتی', label: 'صنعتی' },
  { value: 'تجاری', label: 'تجاری' },
  { value: 'کشاورزی', label: 'کشاورزی' },
  { value: 'عمومی', label: 'عمومی' },
];

const PAGE_SIZES = [10, 20, 50];

function errorText(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

function formatStamp(value: string) {
  return toPersianDigits(value.replace('T', ' ').slice(0, 16));
}

export const LoadAnalyticsView: React.FC<LoadAnalyticsViewProps> = ({
  regionId,
  regionName = 'امور برق',
}) => {
  const [meterPage, setMeterPage] = useState(1);
  const [loadPage, setLoadPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(20);
  const [tariff, setTariff] = useState<'' | TariffType>('');
  const [seenRegion, setSeenRegion] = useState(regionId);
  const [seenTariff, setSeenTariff] = useState(tariff);

  if (regionId !== seenRegion) {
    setSeenRegion(regionId);
    setMeterPage(1);
    setLoadPage(1);
    setCustomerPage(1);
  }
  if (tariff !== seenTariff) {
    setSeenTariff(tariff);
    setCustomerPage(1);
  }

  const [readings, setReadings] = useState<MeterReadingSchema[]>([]);
  const [meterTotal, setMeterTotal] = useState(0);
  const [meterPages, setMeterPages] = useState(1);
  const [meterStatus, setMeterStatus] = useState<RequestStatus>('loading');
  const [meterError, setMeterError] = useState('');

  const [loads, setLoads] = useState<FeederLoadSchema[]>([]);
  const [feederNames, setFeederNames] = useState<Record<number, string>>({});
  const [loadTotal, setLoadTotal] = useState(0);
  const [loadPages, setLoadPages] = useState(1);
  const [loadStatus, setLoadStatus] = useState<RequestStatus>('loading');
  const [loadError, setLoadError] = useState('');

  const [customers, setCustomers] = useState<CustomerSchema[]>([]);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [customerPages, setCustomerPages] = useState(1);
  const [customerStatus, setCustomerStatus] = useState<RequestStatus>('loading');
  const [customerError, setCustomerError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setMeterStatus('loading');
    setMeterError('');
    transbanApi.getMeterReadings(regionId, 50, controller.signal, meterPage)
      .then((raw) => {
        if (controller.signal.aborted) return;
        const result = readPage<MeterReadingSchema>(raw);
        setReadings(result.items);
        setMeterTotal(result.total);
        setMeterPages(result.totalPages);
        setMeterStatus(result.items.length ? 'ready' : 'empty');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setReadings([]);
        setMeterTotal(0);
        setMeterStatus('error');
        setMeterError(errorText(err, 'قرائت کنتورهای هوشمند دریافت نشد'));
      });
    return () => controller.abort();
  }, [regionId, meterPage]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadStatus('loading');
    setLoadError('');
    Promise.allSettled([
      transbanApi.getFeederLoads(regionId, 20, controller.signal, loadPage),
      transbanApi.getFeeders(regionId, 100, controller.signal, 1),
    ])
      .then(([loadResult, feederResult]) => {
        if (controller.signal.aborted) return;
        if (loadResult.status === 'rejected') throw loadResult.reason;
        const result = readPage<FeederLoadSchema>(loadResult.value);
        const names: Record<number, string> = {};
        if (feederResult.status === 'fulfilled') {
          readPage<FeederSchema>(feederResult.value).items.forEach((feeder) => {
            names[feeder.id] = feeder.name;
          });
        }
        setFeederNames(names);
        setLoads(result.items);
        setLoadTotal(result.total);
        setLoadPages(result.totalPages);
        setLoadStatus(result.items.length ? 'ready' : 'empty');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setLoads([]);
        setLoadTotal(0);
        setLoadStatus('error');
        setLoadError(errorText(err, 'جریان فیدرهای منطقه دریافت نشد'));
      });
    return () => controller.abort();
  }, [regionId, loadPage]);

  useEffect(() => {
    const controller = new AbortController();
    setCustomerStatus('loading');
    setCustomerError('');
    transbanApi.getCustomers(regionId, tariff || undefined, customerPageSize, controller.signal, customerPage)
      .then((raw) => {
        if (controller.signal.aborted) return;
        const result = readPage<CustomerSchema>(raw);
        setCustomers(result.items);
        setCustomerTotal(result.total);
        setCustomerPages(result.totalPages);
        setCustomerStatus(result.items.length ? 'ready' : 'empty');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setCustomers([]);
        setCustomerTotal(0);
        setCustomerStatus('error');
        setCustomerError(errorText(err, 'فهرست مشترکین فهام دریافت نشد'));
      });
    return () => controller.abort();
  }, [regionId, tariff, customerPage, customerPageSize]);

  const series = useMemo(
    () => [...readings]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((item) => ({
        time: formatStamp(item.timestamp).slice(-5),
        power: item.active_power_kw,
        voltage: item.voltage,
      })),
    [readings],
  );

  const latest = series[series.length - 1];
  const averagePower = series.length
    ? series.reduce((sum, item) => sum + item.power, 0) / series.length
    : 0;
  const averageVoltage = series.length
    ? series.reduce((sum, item) => sum + item.voltage, 0) / series.length
    : 0;
  const peakAmps = loads.reduce((max, item) => Math.max(max, item.current_amps), 0);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-2xl border border-[#1e2230] bg-[#11131a] p-4">
        <div className="flex items-center gap-2">
          <Radio className="text-cyan-400" size={18} />
          <h2 className="text-base font-bold text-slate-100">تحلیل بار و مصرف فهام ({regionName})</h2>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          قرائت کنتور هوشمند، مشترکین متصل به ترانس و جریان فیدر از سرویس منطقه‌ای
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-[#1e2230] bg-[#11131a] p-4">
        <h3 className="text-sm font-bold text-slate-200">مانیتورینگ کنتورهای هوشمند</h3>
        {meterStatus === 'loading' && <StatusLine text="در حال دریافت قرائت کنتورها..." />}
        {meterStatus === 'error' && <ErrorLine text={meterError} />}
        {meterStatus === 'empty' && <EmptyLine text="قرائتی برای این امور ثبت نشده است." />}
        {meterStatus === 'ready' && (
          <>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <Metric label="آخرین توان اکتیو" value={formatPersianNumber(latest?.power, 2)} unit="kW" tone="text-cyan-400" icon={Zap} />
              <Metric label="میانگین توان صفحه" value={formatPersianNumber(averagePower, 2)} unit="kW" tone="text-cyan-300" icon={Activity} />
              <Metric label="آخرین ولتاژ" value={formatPersianNumber(latest?.voltage, 1)} unit="ولت" tone="text-emerald-400" icon={Gauge} />
              <Metric label="میانگین ولتاژ" value={formatPersianNumber(averageVoltage, 1)} unit="ولت" tone="text-emerald-300" icon={Gauge} />
            </div>
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="power" orientation="right" stroke="#22d3ee" tick={{ fontSize: 10 }} width={42} />
                  <YAxis yAxisId="voltage" orientation="left" stroke="#34d399" tick={{ fontSize: 10 }} width={42} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#11131a', borderColor: '#1e2230', borderRadius: 12, fontSize: 12 }}
                    formatter={(value, name) => [
                      `${formatPersianNumber(Number(value), 2)} ${name === 'ولتاژ' ? 'ولت' : 'kW'}`,
                      name,
                    ]}
                  />
                  <Line yAxisId="power" type="monotone" dataKey="power" name="توان اکتیو" stroke="#22d3ee" strokeWidth={2} dot={false} />
                  <Line yAxisId="voltage" type="monotone" dataKey="voltage" name="ولتاژ" stroke="#34d399" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <Pager
              page={meterPage}
              totalPages={meterPages}
              total={meterTotal}
              onPage={setMeterPage}
            />
          </>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-[#1e2230] bg-[#11131a] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-200">جریان لحظه‌ای فیدرها</h3>
          {loadStatus === 'ready' && (
            <span className="text-[11px] text-cyan-300">
              بیشینه همین صفحه {formatPersianNumber(peakAmps, 1)} آمپر
            </span>
          )}
        </div>
        {loadStatus === 'loading' && <StatusLine text="در حال دریافت جریان فیدرها..." />}
        {loadStatus === 'error' && <ErrorLine text={loadError} />}
        {loadStatus === 'empty' && <EmptyLine text="جریانی برای فیدرهای این امور ثبت نشده است." />}
        {loadStatus === 'ready' && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="text-[11px] text-slate-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">فیدر</th>
                    <th className="px-2 py-2 font-medium">شناسه</th>
                    <th className="px-2 py-2 font-medium">جریان</th>
                    <th className="px-2 py-2 font-medium">زمان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2230] text-slate-300">
                  {loads.map((item) => (
                    <tr key={item.id}>
                      <td className="px-2 py-2">{feederNames[item.feeder_id] || 'فیدر'}</td>
                      <td className="px-2 py-2">{toPersianDigits(item.feeder_id)}</td>
                      <td className="px-2 py-2 text-cyan-300">{formatPersianNumber(item.current_amps, 1)} آمپر</td>
                      <td className="px-2 py-2 text-slate-400">{formatStamp(item.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={loadPage} totalPages={loadPages} total={loadTotal} onPage={setLoadPage} />
          </>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-[#1e2230] bg-[#11131a] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-200">مشترکین فهام</h3>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>تعرفه</span>
            <select
              value={tariff}
              onChange={(event) => setTariff(event.target.value as '' | TariffType)}
              aria-label="فیلتر تعرفه مشترک"
              className="h-8 rounded-lg border border-[#1e2230] bg-[#090a0f] px-2 text-xs text-slate-200 outline-none"
            >
              {TARIFFS.map((item) => (
                <option key={item.label} value={item.value}>{item.label}</option>
              ))}
            </select>
            <select
              value={customerPageSize}
              onChange={(event) => {
                setCustomerPageSize(Number(event.target.value));
                setCustomerPage(1);
              }}
              aria-label="تعداد مشترک در هر صفحه"
              className="h-8 rounded-lg border border-[#1e2230] bg-[#090a0f] px-2 text-xs text-slate-200 outline-none"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{toPersianDigits(size)}</option>
              ))}
            </select>
          </div>
        </div>
        {customerStatus === 'loading' && <StatusLine text="در حال دریافت مشترکین..." />}
        {customerStatus === 'error' && <ErrorLine text={customerError} />}
        {customerStatus === 'empty' && <EmptyLine text="مشترکی با این تعرفه در امور جاری نیست." />}
        {customerStatus === 'ready' && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="text-[11px] text-slate-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">شناسه قبض</th>
                    <th className="px-2 py-2 font-medium">ترانس</th>
                    <th className="px-2 py-2 font-medium">تعرفه</th>
                    <th className="px-2 py-2 font-medium">کنتور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2230] text-slate-300">
                  {customers.map((item) => (
                    <tr key={item.id}>
                      <td className="px-2 py-2">{toPersianDigits(item.bill_id)}</td>
                      <td className="px-2 py-2">{toPersianDigits(item.transformer_id)}</td>
                      <td className="px-2 py-2">{item.tariff_type}</td>
                      <td className="px-2 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${item.is_smart ? 'bg-cyan-500/10 text-cyan-300' : 'bg-slate-500/10 text-slate-400'}`}>
                          {item.is_smart ? 'هوشمند' : 'عادی'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={customerPage} totalPages={customerPages} total={customerTotal} onPage={setCustomerPage} />
          </>
        )}
      </section>
    </div>
  );
};

function Metric({
  label,
  value,
  unit,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit: string;
  tone: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <div className="rounded-2xl border border-[#1e2230] bg-[#090a0f] px-3 py-2.5">
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>{label}</span>
        <Icon size={13} />
      </div>
      <div className={`mt-1 text-lg font-semibold leading-none ${tone}`}>
        {value} <span className="text-[10px] font-normal text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

function Pager({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
      <span>صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)} · {toPersianDigits(total)} رکورد</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-slate-300 hover:bg-white/5 disabled:opacity-40"
        >
          <ChevronRight size={13} /> قبلی
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-slate-300 hover:bg-white/5 disabled:opacity-40"
        >
          بعدی <ChevronLeft size={13} />
        </button>
      </div>
    </div>
  );
}

function StatusLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-xs text-slate-400">
      <Loader2 size={14} className="animate-spin text-cyan-400" />
      {text}
    </div>
  );
}

function ErrorLine({ text }: { text: string }) {
  return <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{text}</div>;
}

function EmptyLine({ text }: { text: string }) {
  return <div className="py-8 text-center text-xs text-slate-500">{text}</div>;
}
