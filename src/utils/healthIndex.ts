import type { DgaTestCreate } from '../services/types';

/** گازهای DGA؛ همان فیلدهای عددی DgaTestCreate در types.ts */
export type DgaGases = Pick<DgaTestCreate, 'c2h2' | 'c2h4' | 'h2' | 'ch4' | 'co'>;

export interface OilQuality {
  breakdownVoltageKv: number;
  waterContentPpm: number;
  acidityMgKohPerG: number;
  interfacialTension: number;
}

export interface TransformerData {
  id: string;
  name: string;
  serialNumber: string;
  regionId: string;
  region?: string;
  feederName: string;
  substationName: string;
  capacityKva: number;
  installYear: number;
  lat: number;
  lng: number;
  currentLoadPercent: number;
  healthIndex: number;
  failureRisk30d: number;
  overloadCount: number;
  lastMaintenanceDate: string;
  dgaGases?: DgaGases;
  telemetry?: any;
  customerBreakdown?: any;
}

// تبدیل ارقام انگلیسی به فارسی
export function toPersianDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

// جدا کردن سه‌رقم سه‌رقم و تبدیل به فارسی (مثل ۳,۸۴۲)
export function formatPersianNumber(num: number | string | undefined | null, fractionDigits?: number): string {
  if (num === undefined || num === null || isNaN(Number(num))) return '۰';
  const value = Number(num);
  const withCommas = fractionDigits === undefined
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
  return toPersianDigits(withCommas);
}

export function calculateOilSubIndex(oil?: Partial<OilQuality>): number {
  if (!oil) return 85;
  const breakdown = Number(oil.breakdownVoltageKv ?? 50);
  const water = Number(oil.waterContentPpm ?? 10);
  const acidity = Number(oil.acidityMgKohPerG ?? 0.05);
  const tension = Number(oil.interfacialTension ?? 35);

  if (breakdown < 30 || water > 35 || acidity > 0.25 || tension < 20) return 35;
  if (breakdown < 40 || water > 25 || acidity > 0.15 || tension < 28) return 70;
  return 100;
}

/** منحنی سن تجهیز: سال نصب و سال مرجع. سن ۱ سال = ۱۰۰، سن ۱۱ سال = ۹۲. */
export function calculateAgeSubIndex(installYear: number, currentYear: number): number {
  const age = Math.max(0, currentYear - installYear);
  if (age <= 1) return 100;
  if (age <= 20) return Math.round(100 - (age - 1) * 0.8);
  const atTwenty = 100 - 19 * 0.8;
  return Math.max(0, Math.round(atTwenty - (age - 20) * 1.8));
}

export function calculateDGASubIndex(dga?: Partial<DgaGases>): number {
  if (!dga) return 85;
  const c2h2 = Number(dga.c2h2 ?? 0);
  const c2h4 = Number(dga.c2h4 ?? 0);
  const h2 = Number(dga.h2 ?? 0);

  if (c2h2 > 5 || c2h4 > 100 || h2 > 200) return 40;
  if (c2h2 > 2 || c2h4 > 50 || h2 > 100) return 70;
  return 90;
}

export function calculateHealthIndex(t: Partial<TransformerData>): {
  status: 'critical' | 'warning' | 'healthy';
  healthIndex: number;
  dgaSubIndex: number;
} {
  if (typeof t.healthIndex === 'number' && !isNaN(t.healthIndex)) {
    const hi = Math.max(5, Math.min(100, t.healthIndex));
    const status = hi < 50 || (t.currentLoadPercent ?? 0) > 100
      ? 'critical'
      : hi <= 80
      ? 'warning'
      : 'healthy';
    return { status, healthIndex: hi, dgaSubIndex: calculateDGASubIndex(t.dgaGases) };
  }

  const loadPercent = Number(t.currentLoadPercent ?? 60);
  const dgaSub = calculateDGASubIndex(t.dgaGases);
  const calculatedHi = Math.max(10, Math.min(100, Math.round(dgaSub * 0.5 + (100 - Math.max(0, loadPercent - 60)) * 0.5)));

  const status = calculatedHi < 50 || loadPercent > 100
    ? 'critical'
    : calculatedHi <= 80
    ? 'warning'
    : 'healthy';

  return { status, healthIndex: calculatedHi, dgaSubIndex: dgaSub };
}

export function calculateFailureRisk(healthIndex: number, loadPercent: number): number {
  const risk = Math.round((100 - healthIndex) * 0.7 + Math.max(0, loadPercent - 80) * 0.3);
  return Math.max(2, Math.min(99, risk));
}
