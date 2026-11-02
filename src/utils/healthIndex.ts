/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DGAReading {
  h2: number;    // Hydrogen (ppm)
  ch4: number;   // Methane (ppm)
  c2h2: number;  // Acetylene (ppm)
  c2h4: number;  // Ethylene (ppm)
  c2h6: number;  // Ethane (ppm)
  co: number;    // Carbon Monoxide (ppm)
  co2: number;   // Carbon Dioxide (ppm)
}

export interface OilCondition {
  breakdownVoltageKv: number; // kV (Good > 40, Acceptable 30-40, Poor < 30)
  waterContentPpm: number;    // ppm (Good < 20, Acceptable 20-35, Poor > 35)
  acidityMgKohPerG: number;   // mg KOH/g (Good < 0.1, Poor > 0.25)
  interfacialTension: number; // mN/m (Good > 30, Poor < 20)
}

export interface TransformerData {
  id: string;
  serialNumber: string;
  name: string;
  regionId: string;
  substationId: string;
  feederId: string;
  type: 'pole' | 'ground'; // هوایی | زمینی
  capacityKva: number; // 100, 250, 400, 630, 800, 1000, 1250, 1600
  installationYear: number;
  manufacturer: string;
  coordinates: [number, number]; // [lat, lng]
  locationName: string;
  
  // Real-time telemetry
  currentLoadKw: number;
  currentLoadPercent: number;
  peakLoadPercent24h: number;
  oilTemperatureC: number;
  ambientTemperatureC: number;
  phaseCurrents: {
    r: number;
    s: number;
    t: number;
  };
  phaseVoltages: {
    r: number;
    s: number;
    t: number;
  };
  powerFactor: number;
  thdCurrentPercent: number;

  // Health and Diagnostics
  dga: DGAReading;
  oil: OilCondition;
  overloadCount30d: number;
  consecutiveOverloadHours: number;
  lastMaintenanceDate: string;
  lastOilTestDate: string;
  
  // Customers attached
  customers: {
    residential: number;
    commercial: number;
    industrial: number;
    agricultural: number;
    public: number;
  };
}

export type HealthStatus = 'normal' | 'warning' | 'critical';

/**
 * Convert English digits to Persian digits
 */
export function toPersianDigits(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

/**
 * Format numbers with comma separators and Persian digits
 */
export function formatPersianNumber(val: number, decimals: number = 0): string {
  if (isNaN(val)) return '۰';
  const fixed = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '،');
  const formatted = parts.join('٫');
  return toPersianDigits(formatted);
}

/**
 * Calculate DGA Sub-Index (0 to 100) based on IEEE C57.104 standard
 */
export function calculateDGASubIndex(dga: DGAReading): number {
  let penalty = 0;

  // Acetylene is the most severe indicator of arcing / discharge
  if (dga.c2h2 > 35) penalty += 45;
  else if (dga.c2h2 > 10) penalty += 25;
  else if (dga.c2h2 > 2) penalty += 10;

  // Ethylene indicates severe high thermal fault
  if (dga.c2h4 > 200) penalty += 30;
  else if (dga.c2h4 > 100) penalty += 18;
  else if (dga.c2h4 > 50) penalty += 8;

  // Hydrogen indicates corona / partial discharge
  if (dga.h2 > 300) penalty += 20;
  else if (dga.h2 > 100) penalty += 10;

  // Methane indicates low-temperature thermal fault
  if (dga.ch4 > 120) penalty += 15;
  else if (dga.ch4 > 50) penalty += 7;

  // Carbon Monoxide indicates solid paper insulation degradation
  if (dga.co > 1000) penalty += 15;
  else if (dga.co > 500) penalty += 7;

  return Math.max(10, Math.min(100, 100 - penalty));
}

/**
 * Calculate Oil Condition Sub-Index (0 to 100)
 */
export function calculateOilSubIndex(oil: OilCondition): number {
  let score = 100;

  // Breakdown Voltage (kV)
  if (oil.breakdownVoltageKv < 25) score -= 35;
  else if (oil.breakdownVoltageKv < 35) score -= 15;

  // Moisture / Water Content (ppm)
  if (oil.waterContentPpm > 35) score -= 30;
  else if (oil.waterContentPpm > 25) score -= 15;

  // Acidity (mg KOH/g)
  if (oil.acidityMgKohPerG > 0.25) score -= 25;
  else if (oil.acidityMgKohPerG > 0.15) score -= 12;

  return Math.max(15, Math.min(100, score));
}

/**
 * Calculate Thermal & Loading Sub-Index (0 to 100)
 */
export function calculateLoadingSubIndex(
  currentLoadPercent: number,
  overloadCount30d: number,
  oilTempC: number
): number {
  let score = 100;

  if (currentLoadPercent > 115) score -= 35;
  else if (currentLoadPercent > 100) score -= 20;
  else if (currentLoadPercent > 85) score -= 8;

  // Overload events frequency
  score -= Math.min(35, overloadCount30d * 4);

  // High oil temperature (> 85 C accelerates paper aging)
  if (oilTempC > 90) score -= 30;
  else if (oilTempC > 80) score -= 15;

  return Math.max(10, Math.min(100, score));
}

/**
 * Calculate Age Sub-Index (0 to 100)
 * Assuming nominal design lifespan of 35-40 years
 */
export function calculateAgeSubIndex(installationYear: number, currentYear: number = 2026): number {
  const age = Math.max(0, currentYear - installationYear);
  if (age <= 5) return 100;
  if (age <= 15) return 92;
  if (age <= 25) return 80;
  if (age <= 35) return 60;
  return Math.max(20, 50 - (age - 35) * 2);
}

/**
 * Calculate overall Health Index (HI) from 0 to 100
 * Weights:
 * - DGA: 40% (most direct condition indicator)
 * - Oil condition: 25%
 * - Loading & Thermal: 20%
 * - Age: 15%
 */
export function calculateHealthIndex(t: TransformerData, currentYear: number = 2026): {
  healthIndex: number;
  status: HealthStatus;
  dgaScore: number;
  oilScore: number;
  loadingScore: number;
  ageScore: number;
} {
  const dgaScore = calculateDGASubIndex(t.dga);
  const oilScore = calculateOilSubIndex(t.oil);
  const loadingScore = calculateLoadingSubIndex(t.currentLoadPercent, t.overloadCount30d, t.oilTemperatureC);
  const ageScore = calculateAgeSubIndex(t.installationYear, currentYear);

  const rawHI = dgaScore * 0.40 + oilScore * 0.25 + loadingScore * 0.20 + ageScore * 0.15;
  const healthIndex = Math.round(Math.max(5, Math.min(100, rawHI)));

  let status: HealthStatus = 'normal';
  if (healthIndex < 50 || t.currentLoadPercent > 120 || t.dga.c2h2 > 30) {
    status = 'critical';
  } else if (healthIndex < 80 || t.currentLoadPercent > 90) {
    status = 'warning';
  }

  return {
    healthIndex,
    status,
    dgaScore,
    oilScore,
    loadingScore,
    ageScore,
  };
}

/**
 * Calculate predictive failure probability for 30 days and 90 days (%)
 */
export function calculateFailureRisk(hi: number, currentLoadPercent: number, overloadCount30d: number): {
  risk30Days: number;
  risk90Days: number;
  riskLevelText: string;
} {
  // Base risk inversely proportional to health index
  let baseRisk = (100 - hi) * 0.85;

  // Add acceleration factor for ongoing overload
  if (currentLoadPercent > 105) {
    baseRisk += (currentLoadPercent - 100) * 1.5;
  }
  baseRisk += overloadCount30d * 2.5;

  const risk30Days = Math.min(96, Math.max(2, Math.round(baseRisk * 0.65)));
  const risk90Days = Math.min(99, Math.max(5, Math.round(baseRisk * 0.95)));

  let riskLevelText = 'پایین (عادی)';
  if (risk30Days > 60 || risk90Days > 75) {
    riskLevelText = 'بسیار بحرانی';
  } else if (risk30Days > 35 || risk90Days > 50) {
    riskLevelText = 'متوسط به بالا (هشدار)';
  } else if (risk30Days > 15) {
    riskLevelText = 'متوسط';
  }

  return {
    risk30Days,
    risk90Days,
    riskLevelText,
  };
}
