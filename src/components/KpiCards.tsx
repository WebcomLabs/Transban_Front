/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, AlertTriangle, Gauge, HeartPulse } from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../utils/healthIndex';

interface KpiCardsProps {
  totalTransformers: number;
  criticalRiskCount: number;
  activeOverloadCount: number;
  averageHealthIndex: number;
  onFilterCriticalClick?: () => void;
  onFilterOverloadClick?: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalTransformers,
  criticalRiskCount,
  activeOverloadCount,
  averageHealthIndex,
  onFilterCriticalClick,
  onFilterOverloadClick,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Widget
        label="ناوگان تحت پایش"
        value={formatPersianNumber(totalTransformers)}
        hint="دستگاه"
        tone="text-cyan-400"
        chip="bg-cyan-500/10 text-cyan-400"
        icon={Activity}
      />
      <Widget
        label="پرریسک"
        value={toPersianDigits(criticalRiskCount)}
        hint="مداخله"
        tone="text-rose-400"
        chip="bg-rose-500/10 text-rose-400"
        icon={AlertTriangle}
        onClick={onFilterCriticalClick}
      />
      <Widget
        label="اضافه‌بار"
        value={toPersianDigits(activeOverloadCount)}
        hint="فعال"
        tone="text-rose-400"
        chip="bg-rose-500/10 text-rose-400"
        icon={Gauge}
        onClick={onFilterOverloadClick}
      />
      <Widget
        label="شاخص سلامت"
        value={`${toPersianDigits(averageHealthIndex.toFixed(1))}٪`}
        hint="میانگین"
        tone="text-emerald-400"
        chip="bg-emerald-500/10 text-emerald-400"
        icon={HeartPulse}
      />
    </div>
  );
};

function Widget({
  label,
  value,
  hint,
  tone,
  chip,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  tone: string;
  chip: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  onClick?: () => void;
}) {
  const className = 'flex w-full items-center gap-2 rounded-2xl border border-[#1e2230] bg-[#11131a] px-2.5 py-2 text-right transition hover:border-cyan-400/25';
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[10px] leading-4 text-slate-500">{label}</div>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className={`text-lg font-semibold leading-none tracking-tight ${tone}`}>{value}</span>
          <span className="truncate text-[10px] text-slate-500">{hint}</span>
        </div>
      </div>
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${chip}`}>
        <Icon size={14} strokeWidth={1.75} />
      </span>
    </>
  );

  if (!onClick) return <div className={className}>{body}</div>;

  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}
