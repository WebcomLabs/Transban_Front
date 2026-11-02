/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  AlertTriangle, 
  Flame, 
  TrendingUp, 
  ArrowLeft, 
  Wrench, 
  ExternalLink,
  ShieldAlert,
  BellRing
} from 'lucide-react';
import { TransformerData, calculateHealthIndex, calculateFailureRisk, toPersianDigits } from '../utils/healthIndex';

interface AlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transformers: TransformerData[];
  onSelectTransformer: (t: TransformerData) => void;
}

export const AlertDrawer: React.FC<AlertDrawerProps> = ({
  isOpen,
  onClose,
  transformers,
  onSelectTransformer,
}) => {
  if (!isOpen) return null;

  // Filter transformers with critical risk or severe overload
  const criticalTransformers = transformers.filter((t) => {
    const { status, healthIndex } = calculateHealthIndex(t);
    return status === 'critical' || healthIndex < 50 || t.currentLoadPercent > 110;
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs transition-opacity" 
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 z-[9999] flex w-full max-w-md flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0E131F] text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <BellRing className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                هشدارهای با اولویت بحرانی (Dispatch Alerts)
              </h3>
              <p className="text-[11px] text-slate-500">
                {toPersianDigits(criticalTransformers.length)} ترانسفورماتور در آستانه آسیب جدی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="بستن پنجره هشدارها"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {criticalTransformers.length > 0 ? (
            criticalTransformers.map((t) => {
              const { healthIndex } = calculateHealthIndex(t);
              const { risk30Days, riskLevelText } = calculateFailureRisk(healthIndex, t.currentLoadPercent, t.overloadCount30d);

              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 transition-all hover:border-rose-500/60 dark:bg-rose-950/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {t.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-cyan-600 dark:text-cyan-400">
                        {t.serialNumber} • {t.locationName}
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      HI: {toPersianDigits(healthIndex)}
                    </span>
                  </div>

                  {/* Critical Reasons */}
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-white/60 p-2 dark:bg-slate-900/60">
                      <span className="text-slate-500">ریسک خرابی ۳۰ روز:</span>
                      <div className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {toPersianDigits(risk30Days)}٪
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/60 p-2 dark:bg-slate-900/60">
                      <span className="text-slate-500">درصد اضافه بار:</span>
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {toPersianDigits(t.currentLoadPercent)}٪ ({toPersianDigits(t.capacityKva)} kVA)
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/60 p-2 dark:bg-slate-900/60">
                      <span className="text-slate-500">دمای روغن مخزن:</span>
                      <div className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {toPersianDigits(t.oilTemperatureC)}°C
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/60 p-2 dark:bg-slate-900/60">
                      <span className="text-slate-500">گاز استیلن C2H2:</span>
                      <div className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {toPersianDigits(t.dga.c2h2)} ppm
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center justify-between border-t border-rose-500/20 pt-2.5">
                    <button
                      onClick={() => {
                        onSelectTransformer(t);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                    >
                      <span>بررسی شناسنامه و اعزام اکیپ</span>
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-400">
                      {toPersianDigits(t.overloadCount30d)} بار اضافه در ماه
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              هیچ ترانسی در وضعیت بحرانی حاد قرار ندارد.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>سیستم اعلان هوشمند دیسپاچینگ</span>
            <span className="font-mono text-emerald-500">READY</span>
          </div>
        </div>

      </div>
    </>
  );
};
