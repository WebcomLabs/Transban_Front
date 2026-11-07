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
    region: 'امور شمال قزوین',
    substationName: 'پست مینودر',
    feederName: 'فیدر بابایی',
    capacityKva: 400,
    installYear: 2018,
    lat: 36.295,
    lng: 50.012,
    currentLoadPercent: 60,
    healthIndex: 92,
    failureRisk30d: 8,
    overloadCount: 0,
    lastMaintenanceDate: '۱۴۰۳/۰۸/۱۵',
    dgaGases: {
      h2: 15,
      ch4: 8,
      c2h2: 0,
      c2h4: 12,
      co: 180,
    },
  };

  const res = calculateHealthIndex(healthyTransformer);
  assert.ok(res.healthIndex >= 85);
  assert.equal(res.status, 'healthy');

  const risk = calculateFailureRisk(res.healthIndex, healthyTransformer.currentLoadPercent);
  assert.ok(risk < 20);
});
