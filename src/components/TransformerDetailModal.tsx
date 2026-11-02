/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Activity, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Thermometer, 
  ShieldAlert, 
  Gauge, 
  Wrench, 
  FileText, 
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { TransformerData, calculateHealthIndex, calculateFailureRisk, toPersianDigits, formatPersianNumber } from '../utils/healthIndex';

interface TransformerDetailModalProps {
  transformer: TransformerData | null;
  onClose: () => void;
  onRegisterWorkOrder?: (transformerId: string, desc: string) => void;
}

export const TransformerDetailModal: React.FC<TransformerDetailModalProps> = ({
  transformer,
  onClose,
  onRegisterWorkOrder,
}) => {
  if (!transformer) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'dga' | 'telemetry' | 'customers' | 'pm'>('overview');
  const [showWorkOrderSuccess, setShowWorkOrderSuccess] = useState(false);

  const { healthIndex, status, dgaScore, oilScore, loadingScore, ageScore } = calculateHealthIndex(transformer);
  const { risk30Days, risk90Days, riskLevelText } = calculateFailureRisk(healthIndex, transformer.currentLoadPercent, transformer.overloadCount30d);

  const handleCreateWorkOrder = () => {
    if (onRegisterWorkOrder) {
      onRegisterWorkOrder(transformer.id, `دستور کار اضطراری نت - ترانس ${transformer.name}`);
    }
    setShowWorkOrderSuccess(true);
    setTimeout(() => setShowWorkOrderSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs transition-opacity animate-fade-in">
      
      {/* Modal Dialog Box */}
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#111827] overflow-hidden text-right">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold ${
                status === 'critical'
                  ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                  : status === 'warning'
                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
              }`}
            >
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white md:text-lg">
                  {transformer.name}
                </h2>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                    status === 'critical'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : status === 'warning'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {status === 'critical' ? 'بحرانی' : status === 'warning' ? 'نیازمند پایش' : 'مطلوب'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono">سریال: {transformer.serialNumber}</span>
                <span>•</span>
                <span>ظرفیت: {toPersianDigits(transformer.capacityKva)} kVA</span>
                <span>•</span>
                <span>نوع: {transformer.type === 'ground' ? 'پست زمینی' : 'پایه هوایی'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="بستن پنجره جزئیات"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 pt-2 overflow-x-auto dark:border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>خلاصه وضعیت و پیش‌بینی خرابی</span>
          </button>

          <button
            onClick={() => setActiveTab('dga')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'dga'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>آنالیز گازهای محلول (DGA) و روغن</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'telemetry'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Gauge className="h-4 w-4" />
            <span>تله‌متری زنده فهام و مقادیر الکتریکی</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'customers'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>مشترکین و تعرفه‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab('pm')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'pm'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>تاریخچه نت و دستور کارها</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {showWorkOrderSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 p-3 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>دستور کار اضطراری نت با شماره پیگیری PM-{Math.floor(100000 + Math.random() * 900000)} در سیستم ثبت و به نزدیک‌ترین اکیپ ارجاع شد.</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              
              {/* Predictive Risk & Health Index Banner */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                
                {/* Health Index Card */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="text-xs text-slate-500 dark:text-slate-400">شاخص سلامت ترانسفورماتور (HI)</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-black text-slate-900 dark:text-white">
                      {toPersianDigits(healthIndex)}
                    </span>
                    <span className="text-xs text-slate-500">از ۱۰۰</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        healthIndex >= 80 ? 'bg-emerald-500' : healthIndex >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${healthIndex}%` }}
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    وضعیت فنی کلی: {healthIndex >= 80 ? 'عالی و استاندارد' : healthIndex >= 50 ? 'نیازمند مراقبت دوره‌ای' : 'بحرانی - نیازمند تعویض یا اورهال'}
                  </div>
                </div>

                {/* 30-Day Failure Risk */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="text-xs text-slate-500 dark:text-slate-400">احتمال خرابی در ۳۰ روز آینده</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`font-mono text-3xl font-black ${risk30Days > 50 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                      {toPersianDigits(risk30Days)}٪
                    </span>
                    <span className="text-xs text-slate-500">سطح: {riskLevelText}</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        risk30Days > 50 ? 'bg-rose-500' : risk30Days > 25 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${risk30Days}%` }}
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    احتمال خرابی در ۹۰ روز: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{toPersianDigits(risk90Days)}٪</span>
                  </div>
                </div>

                {/* Loading Status */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="text-xs text-slate-500 dark:text-slate-400">بار لحظه‌ای فهام</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`font-mono text-3xl font-black ${transformer.currentLoadPercent > 100 ? 'text-rose-500' : 'text-cyan-500'}`}>
                      {toPersianDigits(transformer.currentLoadPercent)}٪
                    </span>
                    <span className="text-xs text-slate-500">({toPersianDigits(transformer.currentLoadKw)} kW)</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        transformer.currentLoadPercent > 100 ? 'bg-rose-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, transformer.currentLoadPercent)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    پیک ۲۴ ساعت گذشته: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{toPersianDigits(transformer.peakLoadPercent24h)}٪</span>
                  </div>
                </div>

              </div>

              {/* Sub-Indices Breakdown Grid */}
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  امتیاز عوامل چهارگانه شاخص سلامت (Weights & Scores)
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-[11px] text-slate-500">آنالیز گازها (DGA - ۴۰٪)</span>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-800 dark:text-slate-100">
                      {toPersianDigits(dgaScore)} / ۱۰۰
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-[11px] text-slate-500">کیفیت روغن عایق (۲۵٪)</span>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-800 dark:text-slate-100">
                      {toPersianDigits(oilScore)} / ۱۰۰
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-[11px] text-slate-500">سابقه اضافه بار و حرارت (۲۰٪)</span>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-800 dark:text-slate-100">
                      {toPersianDigits(loadingScore)} / ۱۰۰
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-[11px] text-slate-500">طول عمر مفید ترانس (۱۵٪)</span>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-800 dark:text-slate-100">
                      {toPersianDigits(ageScore)} / ۱۰۰
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Specifications Table */}
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  شناسنامه فنی و پلاک ترانسفورماتور
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-slate-500">کارخانه سازنده:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{transformer.manufacturer}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">سال نصب و راه‌اندازی:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{toPersianDigits(transformer.installationYear)} (عمر: {toPersianDigits(2026 - transformer.installationYear)} سال)</div>
                  </div>
                  <div>
                    <span className="text-slate-500">نسبت تبدیل ولتاژ:</span>
                    <div className="font-semibold font-mono text-slate-800 dark:text-slate-200">20 kV / 400 V</div>
                  </div>
                  <div>
                    <span className="text-slate-500">موقعیت جغرافیایی GIS:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{transformer.locationName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">تعداد اضافه بار در ۳۰ روز اخیر:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{toPersianDigits(transformer.overloadCount30d)} مرتبه</div>
                  </div>
                  <div>
                    <span className="text-slate-500">آخرین پایش وضعیت روغن:</span>
                    <div className="font-semibold font-mono text-slate-800 dark:text-slate-200">{transformer.lastOilTestDate}</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DGA & OIL CONDITION */}
          {activeTab === 'dga' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    آنالیز گازهای محلول در روغن (DGA) - واحد ppm
                  </h4>
                  <span className="text-[11px] text-slate-500">استاندارد مرجع: IEEE C57.104</span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {/* Acetylene C2H2 */}
                  <div className={`p-3 rounded-xl border ${transformer.dga.c2h2 > 10 ? 'border-rose-500/40 bg-rose-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                    <div className="text-[11px] text-slate-500">استیلن (C₂H₂) - قوس الکتریکی</div>
                    <div className="mt-1 font-mono text-xl font-bold text-slate-800 dark:text-slate-100">
                      {toPersianDigits(transformer.dga.c2h2)} ppm
                    </div>
                    <span className="text-[10px] text-slate-400">حد مجاز استاندارد: &lt; ۲ ppm</span>
                  </div>

                  {/* Ethylene C2H4 */}
                  <div className={`p-3 rounded-xl border ${transformer.dga.c2h4 > 100 ? 'border-rose-500/40 bg-rose-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                    <div className="text-[11px] text-slate-500">اتیلن (C₂H₄) - گرمای شدید</div>
                    <div className="mt-1 font-mono text-xl font-bold text-slate-800 dark:text-slate-100">
                      {toPersianDigits(transformer.dga.c2h4)} ppm
                    </div>
                    <span className="text-[10px] text-slate-400">حد مجاز استاندارد: &lt; ۵۰ ppm</span>
                  </div>

                  {/* Hydrogen H2 */}
                  <div className={`p-3 rounded-xl border ${transformer.dga.h2 > 200 ? 'border-amber-500/40 bg-amber-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                    <div className="text-[11px] text-slate-500">هیدروژن (H₂) - تخلیه جزئی</div>
                    <div className="mt-1 font-mono text-xl font-bold text-slate-800 dark:text-slate-100">
                      {toPersianDigits(transformer.dga.h2)} ppm
                    </div>
                    <span className="text-[10px] text-slate-400">حد مجاز استاندارد: &lt; ۱۰۰ ppm</span>
                  </div>

                  {/* Methane CH4 */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-[11px] text-slate-500">متان (CH₄) - حرارت کم</div>
                    <div className="mt-1 font-mono text-xl font-bold text-slate-800 dark:text-slate-100">
                      {toPersianDigits(transformer.dga.ch4)} ppm
                    </div>
                    <span className="text-[10px] text-slate-400">حد مجاز استاندارد: &lt; ۱۲۰ ppm</span>
                  </div>

                  {/* Carbon Monoxide CO */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-[11px] text-slate-500">مونوکسید کربن (CO) - تخریب عایق کاغذی</div>
                    <div className="mt-1 font-mono text-xl font-bold text-slate-800 dark:text-slate-100">
                      {toPersianDigits(transformer.dga.co)} ppm
                    </div>
                    <span className="text-[10px] text-slate-400">حد مجاز استاندارد: &lt; ۵۰۰ ppm</span>
                  </div>

                  {/* CO2 */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-[11px] text-slate-500">دی‌اکسید کربن (CO₂)</div>
                    <div className="mt-1 font-mono text-xl font-bold text-slate-800 dark:text-slate-100">
                      {toPersianDigits(transformer.dga.co2)} ppm
                    </div>
                    <span className="text-[10px] text-slate-400">حد مجاز نسبت CO2/CO: &gt; ۳</span>
                  </div>
                </div>
              </div>

              {/* Physical/Chemical Oil Tests */}
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  ویژگی‌های فیزیکی و شیمیایی روغن عایق
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <span className="text-[11px] text-slate-500">ولتاژ شکست دی‌الکتریک:</span>
                    <div className="font-mono text-base font-bold text-slate-800 dark:text-slate-200">
                      {toPersianDigits(transformer.oil.breakdownVoltageKv)} kV
                    </div>
                    <span className="text-[10px] text-slate-400">حداقل مجاز: ۳۰ kV</span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <span className="text-[11px] text-slate-500">میزان رطوبت آب:</span>
                    <div className="font-mono text-base font-bold text-slate-800 dark:text-slate-200">
                      {toPersianDigits(transformer.oil.waterContentPpm)} ppm
                    </div>
                    <span className="text-[10px] text-slate-400">حداکثر مجاز: ۳۰ ppm</span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <span className="text-[11px] text-slate-500">عدد اسیدیته (Acidity):</span>
                    <div className="font-mono text-base font-bold text-slate-800 dark:text-slate-200">
                      {toPersianDigits(transformer.oil.acidityMgKohPerG)} mg KOH/g
                    </div>
                    <span className="text-[10px] text-slate-400">حداکثر مجاز: ۰٫۱۵</span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <span className="text-[11px] text-slate-500">کشش بین سطحی (IFT):</span>
                    <div className="font-mono text-base font-bold text-slate-800 dark:text-slate-200">
                      {toPersianDigits(transformer.oil.interfacialTension)} mN/m
                    </div>
                    <span className="text-[10px] text-slate-400">مطلوب: &gt; ۲۸</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TELEMETRY & ELECTRICAL VALUES */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* 3-Phase Current */}
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">جریان فازها (آمپر)</div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">فاز R:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{toPersianDigits(transformer.phaseCurrents.r)} A</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">فاز S:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{toPersianDigits(transformer.phaseCurrents.s)} A</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">فاز T:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{toPersianDigits(transformer.phaseCurrents.t)} A</span>
                    </div>
                  </div>
                </div>

                {/* 3-Phase Voltage */}
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">ولتاژ فازها (ولت)</div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">فاز R:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{toPersianDigits(transformer.phaseVoltages.r)} V</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">فاز S:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{toPersianDigits(transformer.phaseVoltages.s)} V</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">فاز T:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{toPersianDigits(transformer.phaseVoltages.t)} V</span>
                    </div>
                  </div>
                </div>

                {/* Quality & Temperatures */}
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">شاخص‌های توان و حرارت</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">دمای روغن بالای ترانس:</span>
                      <span className={`font-mono font-bold ${transformer.oilTemperatureC > 85 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {toPersianDigits(transformer.oilTemperatureC)}°C
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ضریب توان (Cos &phi;):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {toPersianDigits(transformer.powerFactor.toFixed(2))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">اعوجاج هارمونیکی (THD):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {toPersianDigits(transformer.thdCurrentPercent.toFixed(1))}٪
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMERS ATTACHED */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  تفکیک مشترکین متصل به این ترانسفورماتور
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-center">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-xs text-slate-500">خانگی</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {formatPersianNumber(transformer.customers.residential)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-xs text-slate-500">تجاری</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {formatPersianNumber(transformer.customers.commercial)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-xs text-slate-500">صنعتی</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {formatPersianNumber(transformer.customers.industrial)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-xs text-slate-500">کشاورزی</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {formatPersianNumber(transformer.customers.agricultural)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-xs text-slate-500">عمومی / اداری</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {formatPersianNumber(transformer.customers.public)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PM & MAINTENANCE */}
          {activeTab === 'pm' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    سوابق نگهداری و تعمیرات پیشگیرانه (PM History)
                  </h4>
                  <span className="font-mono text-xs text-slate-500">آخرین اقدام: {transformer.lastMaintenanceDate}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>سرویس دوره‌ای شش ماهه و تست عایقی</span>
                      <span className="font-mono text-slate-400">۱۴۰۳/۰۸/۱۵</span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      تست مقاومت عایقی میگر (Insulation Resistance)، آچارکشی سرکابل‌های فشار ضعیف، نمونه‌برداری روغن مخزن اصلی
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>ترموویژن (تصویربرداری فروسرخ) نقاط داغ</span>
                      <span className="font-mono text-slate-400">۱۴۰۳/۰۴/۱۸</span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      بررسی بوشینگ‌ها با دوربین حرارتی فلیر - ثبت دمای ۷۸ درجه سانتی‌گراد روی کلمپ فاز S
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-xs text-slate-500">
            شناسه تجهیز در GIS: <span className="font-mono text-slate-700 dark:text-slate-300">{transformer.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateWorkOrder}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-500 shadow-md shadow-rose-600/20"
            >
              <Wrench className="h-4 w-4" />
              <span>ثبت دستور کار اضطراری نت</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              بستن
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
