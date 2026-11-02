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
import { TransformerData, calculateHealthIndex, calculateFailureRisk } from './utils/healthIndex';

export default function App() {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<NavTabId>('gis-dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [transformers, setTransformers] = useState<TransformerData[]>(RAW_TRANSFORMERS);
  const [defects, setDefects] = useState<DefectItem[]>(DEFECTS_STREAM);
  const [selectedTransformer, setSelectedTransformer] = useState<TransformerData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState<boolean>(false);

  // Sync dark class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Current selected region object
  const currentRegion = REGIONS.find((r) => r.id === selectedRegionId) || REGIONS[0];

  // Filtered dataset by region
  const filteredTransformers = selectedRegionId === 'all'
    ? transformers
    : transformers.filter((t) => t.regionId === selectedRegionId);

  const filteredSubstations = selectedRegionId === 'all'
    ? SUBSTATIONS
    : SUBSTATIONS.filter((s) => s.regionId === selectedRegionId);

  const filteredFeeders = selectedRegionId === 'all'
    ? FEEDERS
    : FEEDERS.filter((f) => f.regionId === selectedRegionId);

  // KPI Calculations
  let criticalRiskCount = 0;
  let activeOverloadCount = 0;
  let totalHealthIndexSum = 0;

  filteredTransformers.forEach((t) => {
    const { status, healthIndex } = calculateHealthIndex(t);
    totalHealthIndexSum += healthIndex;
    if (status === 'critical') {
      criticalRiskCount++;
    }
    if (t.currentLoadPercent > 100) {
      activeOverloadCount++;
    }
  });

  const averageHealthIndex = filteredTransformers.length > 0
    ? totalHealthIndexSum / filteredTransformers.length
    : 78.4;

  const urgentDefectsCount = defects.filter((d) => d.severity === 'urgent').length;

  // Handlers
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

  const handleRegisterWorkOrder = (tId: string, desc: string) => {
    const t = transformers.find((item) => item.id === tId);
    if (!t) return;

    const newDefectItem: DefectItem = {
      id: `DEF-1403-${Math.floor(9000 + Math.random() * 999)}`,
      transformerId: t.id,
      transformerName: t.name,
      serialNumber: t.serialNumber,
      regionName: currentRegion.name,
      category: 'حرارتی',
      severity: 'urgent',
      severityLabel: 'فوری',
      description: desc,
      reportedDate: '۱۴۰۳/۰۹/۱۴ - هم‌اکنون',
      assignedTeam: 'اکیپ ویژه دیسپاچینگ',
      estimatedResolutionHours: 4,
    };

    setDefects([newDefectItem, ...defects]);
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-[#0B0F19] dark:text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar */}
      <TopBar
        regions={REGIONS}
        selectedRegionId={selectedRegionId}
        onSelectRegion={(id) => setSelectedRegionId(id)}
        criticalAlertCount={criticalRiskCount}
        onOpenAlertDrawer={() => setIsAlertDrawerOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleSidebar={() => setIsSidebarOpenMobile(true)}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1 overflow-hidden min-w-0 max-w-full">
        
        {/* Right Collapsible Sidebar (RTL Start) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          urgentDefectsCount={urgentDefectsCount}
        />

        {/* Center Main Viewport */}
        <main className="flex-1 overflow-y-auto min-w-0 max-w-full p-3 sm:p-4 md:p-6 space-y-6">
          
          {/* Active View Switching */}
          {activeTab === 'gis-dashboard' && (
            <div className="space-y-6">
              
              {/* Primary KPI Cards Strip */}
              <KpiCards
                totalTransformers={currentRegion.transformerCount}
                criticalRiskCount={criticalRiskCount}
                activeOverloadCount={activeOverloadCount}
                averageHealthIndex={averageHealthIndex}
                onFilterCriticalClick={() => setIsAlertDrawerOpen(true)}
                onFilterOverloadClick={() => setActiveTab('load-analytics')}
              />

              {/* Central Interactive GIS Map */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-500">GIS MAP</span>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      نقشه پایش مکانی ترانسفورماتورها و خطوط فیدر ({currentRegion.name})
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500">
                    کلیک روی هر نشانگر برای استخراج مشخصات و تحلیل DGA
                  </span>
                </div>

                <GisMap
                  transformers={filteredTransformers}
                  substations={filteredSubstations}
                  feeders={filteredFeeders}
                  selectedTransformer={selectedTransformer}
                  onSelectTransformer={(t) => setSelectedTransformer(t)}
                  onOpenDetailModal={handleOpenDetailModal}
                  centerCoordinates={currentRegion.center}
                />
              </div>

              {/* Analytical Cards Below GIS Map */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* 24h Load vs AI Forecast Area Chart (2 cols) */}
                <div className="lg:col-span-2">
                  <LoadForecastChart regionName={currentRegion.name} />
                </div>

                {/* Transformer HI Distribution Pie/Donut (1 col) */}
                <div className="lg:col-span-1">
                  <HealthIndexPieChart transformers={filteredTransformers} />
                </div>
              </div>

              {/* Live Defect & Alert Stream Table */}
              <DefectStreamTable
                defects={defects}
                onSelectTransformerId={handleSelectTransformerFromId}
                onOpenNewDefectModal={() => setActiveTab('defects-pm')}
              />

            </div>
          )}

          {activeTab === 'health-index' && (
            <HealthIndexTableView
              transformers={filteredTransformers}
              regions={REGIONS}
              onSelectTransformer={handleOpenDetailModal}
            />
          )}

          {activeTab === 'load-analytics' && (
            <LoadAnalyticsView />
          )}

          {activeTab === 'defects-pm' && (
            <DefectsManagementView
              onSelectTransformerId={handleSelectTransformerFromId}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
          )}

        </main>
      </div>

      {/* Transformer Detail Modal / Drawer */}
      <TransformerDetailModal
        transformer={selectedTransformer}
        onClose={() => setIsDetailModalOpen(false)}
        onRegisterWorkOrder={handleRegisterWorkOrder}
      />

      {/* Critical Alerts Drawer */}
      <AlertDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        transformers={transformers}
        onSelectTransformer={(t) => {
          setSelectedTransformer(t);
          setIsDetailModalOpen(true);
        }}
      />

    </div>
  );
}
