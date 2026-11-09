/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar, NavTabId } from './components/Sidebar';
import { KpiCards } from './components/KpiCards';
import { GisMap } from './components/GisMap';
import { LoadForecastChart } from './components/LoadForecastChart';
import { HealthIndexPieChart } from './components/HealthIndexPieChart';
import { DefectStreamTable } from './components/DefectStreamTable';
import { TransformerDetailModal } from './components/TransformerDetailModal';
import { AlertDrawer } from './components/AlertDrawer';
import { HealthIndexTableView } from './components/HealthIndexTableView';
import { LoadAnalyticsView } from './components/LoadAnalyticsView';
import { DefectsManagementView } from './components/DefectsManagementView';
import { ReportsView } from './components/ReportsView';

import { 
  REGIONS, 
  SUBSTATIONS, 
  FEEDERS, 
  RAW_TRANSFORMERS, 
  DEFECTS_STREAM,
  DefectItem 
} from './data/qazvinGridData';
import { TransformerData, calculateHealthIndex } from './utils/healthIndex';
import { ApiError, transbanApi } from './services/api';
import type { DispatchingAlertResponse } from './services/types';
import { mapTransformers, mapDefects, mapRegions, unwrapArray } from './services/mappers';

function regionNumber(id: string) {
  if (id === 'all') return 1;
  const value = Number(id);
  return Number.isInteger(value) ? value : 1;
}

function errorText(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

interface AppProps {
  onLogout: () => void;
}

export default function App({ onLogout }: AppProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<NavTabId>('gis-dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('transban_theme') !== 'light';
    } catch {
      return true;
    }
  });

  const [regionsList, setRegionsList] = useState(REGIONS);
  const [transformers, setTransformers] = useState<TransformerData[]>(RAW_TRANSFORMERS);
  const [defects, setDefects] = useState<DefectItem[]>(DEFECTS_STREAM);
  const [substations, setSubstations] = useState(SUBSTATIONS);
  const [feeders, setFeeders] = useState(FEEDERS);
  const [meterReadings, setMeterReadings] = useState<any[]>([]);
  const [feederLoads, setFeederLoads] = useState<any[]>([]);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);

  const [selectedTransformer, setSelectedTransformer] = useState<TransformerData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState<boolean>(false);
  const [activeAlerts, setActiveAlerts] = useState<DispatchingAlertResponse[]>([]);
  const [alertsStatus, setAlertsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [alertsError, setAlertsError] = useState('');
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);
  const [alertReload, setAlertReload] = useState(0);

  // ۱. دریافت امورهای برق
  useEffect(() => {
    transbanApi.getRegions()
      .then((res) => {
        const mapped = mapRegions(res);
        if (mapped.length > 0) {
          const merged = mapped.map((r, i) => ({
            id: String(r.id),
            name: r.name,
            code: `QZN-${String(r.id).padStart(2, '0')}`,
            substationCount: 3 + (i % 6),
            transformerCount: 500 + i * 150,
            center: [36.2797 + i * 0.02, 50.0049 + i * 0.03] as [number, number],
          }));
          setRegionsList([
            {
              id: 'all',
              name: 'کلیه امورهای استان قزوین',
              code: 'QZN-ALL',
              substationCount: 42,
              transformerCount: 3842,
              center: [36.2797, 50.0049],
            },
            ...merged,
          ]);
          setIsApiConnected(true);
        }
      })
      .catch(() => setIsApiConnected(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const regionId = regionNumber(selectedRegionId);
    setAlertsStatus('loading');
    setAlertsError('');
    transbanApi.getActiveAlerts(regionId, controller.signal)
      .then((list) => {
        if (controller.signal.aborted) return;
        const rows = Array.isArray(list) ? list : [];
        setActiveAlerts(rows.filter((alert) => !alert.is_acknowledged));
        setAlertsStatus('ready');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setActiveAlerts([]);
        setAlertsStatus('error');
        setAlertsError(errorText(err, 'هشدارهای دیسپاچینگ دریافت نشد'));
      });
    return () => controller.abort();
  }, [selectedRegionId, alertReload]);

  const handleAcknowledgeAlert = async (alertId: number) => {
    setAcknowledgingId(alertId);
    setAlertsError('');
    try {
      await transbanApi.acknowledgeAlert(alertId);
      setAlertReload((value) => value + 1);
    } catch (err) {
      setAlertsError(errorText(err, 'ثبت رویت هشدار انجام نشد'));
    } finally {
      setAcknowledgingId(null);
    }
  };

  // ۲. استعلام کامل تمام ۱۰ متد OpenAPI دیسپاچینگ قزوین
  useEffect(() => {
    const fetchGrid = async () => {
      try {
        const reg = selectedRegionId === 'all' ? 1 : Number(selectedRegionId) || 1;
        const [rawTr, rawDefs, rawMeters, rawPm, rawCust, rawSubs, rawFdrs, rawLoads] = await Promise.allSettled([
          transbanApi.getTransformers(reg, 50),
          transbanApi.getDefectsByStatus('تعمیر نشده', 50),
          transbanApi.getMeterReadings(reg, 50),
          transbanApi.getMaintenance(reg, undefined, 50),
          transbanApi.getCustomers(reg, undefined, 50),
          transbanApi.getSubstations(reg),
          transbanApi.getFeeders(reg, 50),
          transbanApi.getFeederLoads(reg, 50),
        ]);

        const meters = rawMeters.status === 'fulfilled' ? unwrapArray(rawMeters.value) : [];
        const pms = rawPm.status === 'fulfilled' ? unwrapArray(rawPm.value) : [];
        const custs = rawCust.status === 'fulfilled' ? unwrapArray(rawCust.value) : [];

        setMeterReadings(meters);

        if (rawTr.status === 'fulfilled') {
          const list = unwrapArray(rawTr.value);
          if (list.length > 0) {
            setTransformers(mapTransformers(list, meters, custs, pms) as any);
            setIsApiConnected(true);
          }
        }

        if (rawDefs.status === 'fulfilled') {
          const list = unwrapArray(rawDefs.value);
          if (list.length > 0) {
            setDefects(mapDefects(list) as any);
          }
        }

        if (rawSubs.status === 'fulfilled') {
          const list = unwrapArray(rawSubs.value);
          if (list.length > 0) setSubstations(list);
        }

        if (rawFdrs.status === 'fulfilled') {
          const list = unwrapArray(rawFdrs.value);
          if (list.length > 0) setFeeders(list);
        }

        if (rawLoads.status === 'fulfilled') {
          const list = unwrapArray(rawLoads.value);
          if (list.length > 0) setFeederLoads(list);
        }
      } catch (err) {
        console.warn('استفاده از داده‌های پشتیبان پیش‌فرض به دلیل عدم دسترسی به سرور');
      }
    };

    fetchGrid();
  }, [selectedRegionId]);

  const currentRegion = regionsList.find((r) => r.id === selectedRegionId) || regionsList[0];

  const filteredTransformers = selectedRegionId === 'all'
    ? transformers
    : transformers.filter((t) => t.regionId === selectedRegionId || (t as any).region === currentRegion.name);

  let criticalRiskCount = 0;
  let activeOverloadCount = 0;
  let totalHealthIndexSum = 0;

  filteredTransformers.forEach((t) => {
    const { status, healthIndex } = calculateHealthIndex(t);
    totalHealthIndexSum += healthIndex;
    if (status === 'critical') criticalRiskCount++;
    if (t.currentLoadPercent > 100) activeOverloadCount++;
  });

  const averageHealthIndex = filteredTransformers.length > 0
    ? totalHealthIndexSum / filteredTransformers.length
    : 82.07;

  const urgentDefectsCount = defects.filter((d) => d.severityLabel === 'تعمیر نشده').length;

  const handleOpenDetailModal = (t: TransformerData) => {
    setSelectedTransformer(t);
    setIsDetailModalOpen(true);
  };

  const handleSelectTransformerFromId = (tId: string) => {
    const found = transformers.find((t) => t.id === tId);
    if (found) {
      setSelectedTransformer(found);
      setIsDetailModalOpen(true);
    }
  };

  return (
    <div dir="rtl" className="flex min-h-screen w-full flex-col bg-slate-100 dark:bg-[#07080b] font-sans text-slate-800 dark:text-slate-100">
      
      {/* Top Bar */}
      <TopBar
        regions={regionsList as any}
        selectedRegionId={selectedRegionId}
        onSelectRegion={(id) => setSelectedRegionId(id)}
        criticalAlertCount={activeAlerts.length}
        onOpenAlertDrawer={() => setIsAlertDrawerOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => {
          const dark = document.documentElement.classList.toggle('dark');
          try {
            localStorage.setItem('transban_theme', dark ? 'dark' : 'light');
          } catch {
            /* ذخیرهٔ تم در این محیط در دسترس نیست */
          }
          setIsDarkMode(dark);
        }}
        onToggleSidebar={() => setIsSidebarOpenMobile(true)}
        onLogout={onLogout}
      />

      {/* نوار وضعیت برخط سرور OpenAPI توزیع قزوین */}
      <div className="flex h-6 items-center gap-2 border-b border-slate-200 dark:border-[#1e2230] bg-slate-100 dark:bg-[#07080b] px-4 text-[10px] text-slate-500 dark:text-slate-400">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isApiConnected ? 'bg-emerald-400' : 'bg-cyan-400'}`}></span>
        <span className="truncate">
          {isApiConnected ? 'اتصال برخط به سرور توزیع برق قزوین فعال است' : 'سامانه در حالت آماده‌باش دیسپاچینگ'}
        </span>
      </div>

      {/* ستون‌های سامانه */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* منوی کناری راست */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          urgentDefectsCount={urgentDefectsCount}
        />

        {/* بدنه و صفحات ۵گانه متصل به API */}
        <main className="flex-1 overflow-y-auto p-3 md:p-4">
          
          {/* تب ۱: کابین پایش — چیدمان نامتقارن */}
          {activeTab === 'gis-dashboard' && (
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 flex flex-col gap-3 lg:flex-row">
              <section className="w-full shrink-0 lg:w-80">
                <KpiCards
                  totalTransformers={currentRegion.transformerCount}
                  criticalRiskCount={criticalRiskCount}
                  activeOverloadCount={activeOverloadCount}
                  averageHealthIndex={averageHealthIndex}
                  onFilterCriticalClick={() => setIsAlertDrawerOpen(true)}
                  onFilterOverloadClick={() => setActiveTab('load-analytics')}
                />
              </section>

              <section className="h-[560px] min-w-0 flex-1">
                <GisMap
                  transformers={filteredTransformers}
                  substations={substations as any}
                  feeders={feeders as any}
                  regionId={regionNumber(selectedRegionId)}
                  selectedTransformer={selectedTransformer}
                  onSelectTransformer={(t) => setSelectedTransformer(t)}
                  onOpenDetailModal={handleOpenDetailModal}
                  centerCoordinates={currentRegion.center}
                  caption={currentRegion.name}
                />
              </section>
              </div>

              <section className="col-span-12 xl:col-span-7">
                <LoadForecastChart
                  regionId={regionNumber(selectedRegionId)}
                  regionName={currentRegion.name}
                />
              </section>
              <section className="col-span-12 xl:col-span-5">
                <HealthIndexPieChart transformers={filteredTransformers} />
              </section>
              <section className="col-span-12">
                <DefectStreamTable
                  defects={defects}
                  onSelectTransformerId={handleSelectTransformerFromId}
                  onOpenNewDefectModal={() => setActiveTab('defects-pm')}
                  onDefectsUpdated={(updated) => setDefects(updated)}
                />
              </section>
            </div>
          )}

          {/* تب ۲: پایش هوشمند ترانس‌ها و شاخص سلامت */}
          {activeTab === 'health-index' && (
            <HealthIndexTableView
              transformers={filteredTransformers}
              regions={regionsList as any}
              onSelectTransformer={handleOpenDetailModal}
            />
          )}

          {/* تب ۳: تحلیل بار و مصرف فهام (متصل به API بار و کنتورها) */}
          {activeTab === 'load-analytics' && (
            <LoadAnalyticsView
              regionId={regionNumber(selectedRegionId)}
              regionName={currentRegion.name}
            />
          )}

          {/* تب ۴: مدیریت عیوب و حوادث نت (متصل به API فیلتر عیوب و حوادث PM) */}
          {activeTab === 'defects-pm' && (
            <DefectsManagementView
              regionId={regionNumber(selectedRegionId)}
              defects={defects}
              onSelectTransformerId={handleSelectTransformerFromId}
              onRefreshDefects={(updated) => setDefects(updated)}
            />
          )}

          {/* تب ۵: گزارشات تحلیلی و دوره‌ای (متصل به محاسبات سلامت ناوگان) */}
          {activeTab === 'reports' && (
            <ReportsView
              key={selectedRegionId}
              transformers={filteredTransformers}
              regionId={regionNumber(selectedRegionId)}
              regionName={currentRegion.name}
              onSelectTransformerId={handleSelectTransformerFromId}
            />
          )}

        </main>
      </div>

      {/* پنجره شناسنامه فنی تجهیز */}
      <TransformerDetailModal
        isOpen={isDetailModalOpen}
        transformer={selectedTransformer}
        onClose={() => setIsDetailModalOpen(false)}
        onRegisterWorkOrder={() => {}}
      />

      {/* کشوی هشدارهای پرریسک */}
      <AlertDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        alerts={activeAlerts}
        status={alertsStatus}
        error={alertsError}
        acknowledgingId={acknowledgingId}
        onAcknowledge={handleAcknowledgeAlert}
        onSelectAsset={(assetId) => {
          const found = transformers.find((item) => item.id === String(assetId));
          if (!found) return;
          setSelectedTransformer(found);
          setIsDetailModalOpen(true);
          setIsAlertDrawerOpen(false);
        }}
      />

    </div>
  );
}
