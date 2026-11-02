/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Map, 
  Activity, 
  TrendingUp, 
  Wrench, 
  FileText, 
  ShieldCheck, 
  ChevronLeft, 
  X,
  Gauge
} from 'lucide-react';
import { toPersianDigits } from '../utils/healthIndex';

export type NavTabId = 'gis-dashboard' | 'health-index' | 'load-analytics' | 'defects-pm' | 'reports';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  urgentDefectsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  urgentDefectsCount,
}) => {
  const navItems = [
    {
      id: 'gis-dashboard' as NavTabId,
      label: 'داشبورد جامع و نقشه GIS',
      icon: Map,
      badge: null,
      desc: 'پایش موقعیت مکانی و وضعیت فیدرها',
    },
    {
      id: 'health-index' as NavTabId,
      label: 'پایش هوشمند ترانس‌ها و شاخص سلامت',
      icon: Activity,
      badge: null,
      desc: 'محاسبه Health Index و آنالیز گازهای روغن DGA',
    },
    {
      id: 'load-analytics' as NavTabId,
      label: 'تحلیل بار و مصرف فهام',
      icon: TrendingUp,
      badge: 'هوشمند',
      desc: 'کنتورهای فهام و پیش‌بینی مصرف پیک',
    },
    {
      id: 'defects-pm' as NavTabId,
      label: 'مدیریت عیوب و حوادث نت',
      icon: Wrench,
      badge: urgentDefectsCount > 0 ? `${toPersianDigits(urgentDefectsCount)} فوری` : null,
      badgeAlert: urgentDefectsCount > 0,
      desc: 'حوادث، نشتی‌ها و کارتابل تعمیرات پیشگیرانه',
    },
    {
      id: 'reports' as NavTabId,
      label: 'گزارشات تحلیلی و دوره‌ای',
      icon: FileText,
      badge: null,
      desc: 'آمار عمر ناوگان، تلفات و لیست جایگزینی',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 right-0 z-[9991] flex flex-col border-l border-slate-200 bg-white transition-all duration-300 dark:border-slate-800/80 dark:bg-[#0E131F] md:static ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-72'} w-72`}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800/80 md:hidden">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
            منوی سامانه‌ ترانسبان
          </span>
          <button
            onClick={onCloseMobile}
            aria-label="بستن منو"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop Collapse Button */}
        <div className="hidden items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800/80 md:flex">
          {!isCollapsed && (
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500">
              زیرسیستم‌های یکپارچه
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'گسترش منو' : 'جمع کردن منو'}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
              isCollapsed ? 'mx-auto' : ''
            }`}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-200 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`group relative flex w-full items-center rounded-xl px-3 py-3 text-right text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600 shadow-xs dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:group-hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {!isCollapsed && (
                  <div className="mr-3 flex flex-1 items-center justify-between overflow-hidden">
                    <div className="truncate">
                      <div className="truncate text-xs font-semibold md:text-sm">
                        {item.label}
                      </div>
                      <div className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                        {item.desc}
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`mr-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          item.badgeAlert
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Active Indicator Line */}
                {isActive && (
                  <span className="absolute inset-y-2 right-0 w-1 rounded-l-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Subsystem Integration Status Box in Footer */}
        {!isCollapsed ? (
          <div className="border-t border-slate-200 p-4 dark:border-slate-800/80">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800/60 dark:bg-slate-900/60">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  اتصال ۴ سامانه مبنا
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  برخط
                </span>
              </div>
              <div className="space-y-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>سامانه مکانی GIS:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">SYNCED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>کنتورهای فهام (MDM):</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">۹۹٫۲٪</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>صورتحساب و مشترکین:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>نت و حوادث (PM):</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">CONNECTED</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-200 p-3 text-center dark:border-slate-800/80">
            <div className="flex h-8 w-8 mx-auto items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" title="اتصال کامل سیستم‌های چهارگانه">
              <Gauge className="h-4 w-4" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
