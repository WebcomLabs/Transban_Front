/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toPersianDigits,
  formatPersianNumber,
  calculateDGASubIndex,
  calculateOilSubIndex,
  calculateAgeSubIndex,
  calculateHealthIndex,
  calculateFailureRisk,
  TransformerData,
} from './healthIndex';

test('toPersianDigits converts English digits to Persian correctly', () => {
  assert.equal(toPersianDigits('1234567890'), '۱۲۳۴۵۶۷۸۹۰');
  assert.equal(toPersianDigits(456), '۴۵۶');
  assert.equal(toPersianDigits('Trans-04'), 'Trans-۰۴');
});

test('formatPersianNumber formats with commas and decimals', () => {
  assert.equal(formatPersianNumber(1000), '۱،۰۰۰');
  assert.equal(formatPersianNumber(3842), '۳،۸۴۲');
  assert.equal(formatPersianNumber(78.4, 1), '۷۸٫۴');
});

test('calculateDGASubIndex penalizes acetylene (C2H2) and ethylene (C2H4)', () => {
  const healthyDGA = {
    h2: 20,
    ch4: 10,
    c2h2: 0,
    c2h4: 15,
    c2h6: 5,
    co: 150,
    co2: 1200,
  };
  const healthyScore = calculateDGASubIndex(healthyDGA);
  assert.equal(healthyScore, 100);

  const degradedDGA = {
    h2: 350,
    ch4: 150,
    c2h2: 40,
    c2h4: 250,
    c2h6: 30,
    co: 1100,
    co2: 5000,
  };
  const degradedScore = calculateDGASubIndex(degradedDGA);
  assert.ok(degradedScore <= 30);
});

test('calculateOilSubIndex drops on low breakdown voltage or high moisture', () => {
  const goodOil = {
    breakdownVoltageKv: 55,
    waterContentPpm: 12,
    acidityMgKohPerG: 0.05,
    interfacialTension: 35,
  };
  assert.equal(calculateOilSubIndex(goodOil), 100);

  const badOil = {
    breakdownVoltageKv: 20,
    waterContentPpm: 45,
    acidityMgKohPerG: 0.35,
    interfacialTension: 16,
  };
  assert.ok(calculateOilSubIndex(badOil) <= 40);
});

test('calculateAgeSubIndex respects asset aging curves', () => {
  assert.equal(calculateAgeSubIndex(2025, 2026), 100);
  assert.equal(calculateAgeSubIndex(2015, 2026), 92);
  assert.ok(calculateAgeSubIndex(1985, 2026) < 50);
});

test('calculateHealthIndex produces coherent status (normal, warning, critical)', () => {
  const healthyTransformer: TransformerData = {
    id: 'TR-QZN-001',
    serialNumber: 'IT-98214-400',
    name: 'ترانس زمینی شهید بابایی ۱',
    regionId: 'reg-north-qazvin',
    substationId: 'sub-minoodar',
    feederId: 'fdr-babaee',
    type: 'ground',
    capacityKva: 400,
    installationYear: 2018,
    manufacturer: 'ایران ترانسفو',
    coordinates: [36.295, 50.012],
    locationName: 'بلوار شهید بابایی، کوچه ۲۴',
    currentLoadKw: 240,
    currentLoadPercent: 60,
    peakLoadPercent24h: 75,
    oilTemperatureC: 58,
    ambientTemperatureC: 28,
    phaseCurrents: { r: 345, s: 350, t: 342 },
    phaseVoltages: { r: 231, s: 230, t: 229 },
    powerFactor: 0.94,
    thdCurrentPercent: 2.8,
    dga: {
      h2: 15,
      ch4: 8,
      c2h2: 0,
      c2h4: 12,
      c2h6: 6,
      co: 180,
      co2: 1400,
    },
    oil: {
      breakdownVoltageKv: 52,
      waterContentPpm: 14,
      acidityMgKohPerG: 0.04,
      interfacialTension: 36,
    },
    overloadCount30d: 0,
    consecutiveOverloadHours: 0,
    lastMaintenanceDate: '۱۴۰۳/۰۸/۱۵',
    lastOilTestDate: '۱۴۰۳/۰۹/۱۰',
    customers: {
      residential: 185,
      commercial: 24,
      industrial: 0,
      agricultural: 0,
      public: 4,
    },
  };

  const res = calculateHealthIndex(healthyTransformer, 2026);
  assert.ok(res.healthIndex >= 85);
  assert.equal(res.status, 'normal');

  const risk = calculateFailureRisk(res.healthIndex, healthyTransformer.currentLoadPercent, healthyTransformer.overloadCount30d);
  assert.ok(risk.risk30Days < 20);
});
