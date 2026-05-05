'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const emptyMonths = () => Array(12).fill(0);
const emptyOptionalMonths = () => Array(12).fill(null);
const categoryNames = [
  'Restaurants', 'Travel', 'Groceries', 'Entertainment', 'Healthcare', 'Transportation',
  'Clothes', 'Gifts', 'Gym', 'Tech', 'Self Care', 'Business', 'Misc',
];

function createDefaultPlan() {
  return {
    income: emptyMonths(),
    investing: emptyMonths(),
    rent: emptyMonths(),
    budgetSp: emptyMonths(),
    fixedInv: emptyOptionalMonths(),
    budgetCats: Object.fromEntries(categoryNames.map((name) => [name, emptyMonths()])),
  };
}

const providers = {
  cc: {
    label: 'Credit Cards',
    items: [
      { id: 'chase', name: 'Chase UR', color: '#185FA5' },
      { id: 'amex', name: 'Amex MR', color: '#1D6FA0' },
      { id: 'bilt', name: 'Bilt', color: '#2C5F8A' },
      { id: 'citi', name: 'Citi ThankYou', color: '#4A90B8' },
      { id: 'cap1', name: 'Capital One', color: '#CC3333' },
      { id: 'usbank', name: 'US Bank', color: '#1B4D8E' },
      { id: 'barclays', name: 'Barclays', color: '#005B8E' },
      { id: 'wells', name: 'Wells Fargo', color: '#CC0000' },
    ],
  },
  hotel: {
    label: 'Hotels',
    items: [
      { id: 'hyatt', name: 'Hyatt', color: '#8B0000' },
      { id: 'marriott', name: 'Marriott Bonvoy', color: '#C8102E' },
      { id: 'hilton', name: 'Hilton Honors', color: '#003087' },
      { id: 'ihg', name: 'IHG One', color: '#005C5C' },
      { id: 'wyndham', name: 'Wyndham', color: '#0033A0' },
      { id: 'choice', name: 'Choice', color: '#2C6E8A' },
      { id: 'accor', name: 'ALL Accor', color: '#8B4513' },
      { id: 'radisson', name: 'Radisson', color: '#B22222' },
    ],
  },
  airline: {
    label: 'Airlines',
    items: [
      { id: 'united', name: 'United MileagePlus', color: '#005DAA' },
      { id: 'american', name: 'American AAdvantage', color: '#CC0000' },
      { id: 'delta', name: 'Delta SkyMiles', color: '#9B1B30' },
      { id: 'southwest', name: 'Southwest RR', color: '#CC3300' },
      { id: 'aircanada', name: 'Air Canada Aeroplan', color: '#C41230' },
      { id: 'alaska', name: 'Alaska Mileage Plan', color: '#01426A' },
      { id: 'british', name: 'British Avios', color: '#2B5296' },
      { id: 'emirates', name: 'Emirates Skywards', color: '#C6963A' },
      { id: 'lufthansa', name: 'Lufthansa Miles & More', color: '#05164D' },
      { id: 'jetblue', name: 'JetBlue TrueBlue', color: '#003876' },
    ],
  },
};

const colors = {
  income: '#185FA5',
  invest: '#575799',
  rent: '#993C1D',
  spend: '#BA7517',
  proj: '#534AB7',
  actual: '#1D9E75',
  cf: '#3B6D11',
  bank: '#378ADD',
  danger: '#E24B4A',
};

const catColors = [
  '#185FA5', '#0F6E56', '#993C1D', '#BA7517', '#534AB7', '#D85A30', '#1D9E75',
  '#D4537E', '#639922', '#88786F', '#3266AD', '#633806', '#888780',
];

const mainTabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'income', label: 'Income' },
  { key: 'spending', label: 'Spending' },
  { key: 'investments', label: 'Investments' },
  { key: 'retirement', label: 'Retirement' },
  { key: 'projection', label: 'Projection' },
  { key: 'points', label: 'Points & Miles' },
];

const subTabs = [
  { key: 'balances', label: 'Balances' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'transactions', label: 'Transactions' },
];

const onboardingSteps = ['Focus', 'Monthly Plan', 'Categories', 'Actuals', 'Projection', 'Points', 'Review'];

const retirementSubTabs = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'projections', label: 'Projections' },
  { key: 'withdrawals', label: 'Withdrawals' },
];

const IRS_LIMITS_2026 = { k401: 23500, k401Catchup: 7500, ira: 7000, iraCatchup: 1000 };

const ACCOUNT_TYPES = [
  { key: 'traditional_401k', label: 'Traditional 401(k)', shortLabel: 'Trad 401k', isRoth: false, is401k: true, canLink: true },
  { key: 'roth_401k', label: 'Roth 401(k)', shortLabel: 'Roth 401k', isRoth: true, is401k: true, canLink: true },
  { key: 'traditional_ira', label: 'Traditional IRA', shortLabel: 'Trad IRA', isRoth: false, is401k: false, canLink: false },
  { key: 'roth_ira', label: 'Roth IRA', shortLabel: 'Roth IRA', isRoth: true, is401k: false, canLink: false },
  { key: 'sep_ira', label: 'SEP IRA', shortLabel: 'SEP IRA', isRoth: false, is401k: false, canLink: false },
];

const BRACKETS_2026_SINGLE = [
  { rate: 0.10, upTo: 11925 },
  { rate: 0.12, upTo: 48475 },
  { rate: 0.22, upTo: 103350 },
  { rate: 0.24, upTo: 197300 },
  { rate: 0.32, upTo: 250525 },
  { rate: 0.35, upTo: 626350 },
  { rate: 0.37, upTo: Infinity },
];
const STD_DEDUCTION_2026 = 15000;

const paycheckFrequencies = [
  { key: 'weekly', label: 'Weekly', checks: 52, intervalDays: 7 },
  { key: 'biweekly', label: 'Biweekly', checks: 26, intervalDays: 14 },
  { key: 'semimonthly', label: 'Twice monthly', checks: 24 },
  { key: 'monthly', label: 'Monthly', checks: 12 },
];

function createDefaultIncomeConfig() {
  return {
    annualSalary: 0,
    frequency: 'semimonthly',
    firstPayDate: '2026-01-02',
    taxesPerPaycheck: 0,
    fsaPerPaycheck: 0,
    insurancePerPaycheck: 0,
    preTax401kPerPaycheck: 0,
    afterTaxRothPerPaycheck: 0,
    oneTimeEvents: [],
  };
}

function normalizeOneTimeEvent(ev) {
  return {
    id: (typeof ev.id === 'string' && ev.id) ? ev.id : Math.random().toString(36).slice(2),
    name: typeof ev.name === 'string' ? ev.name : '',
    month: Math.max(0, Math.min(11, Math.round(Number(ev.month) || 0))),
    gross: cleanNumber(ev.gross, 0),
    taxWithheld: cleanNumber(ev.taxWithheld, 0),
  };
}

function createDefaultRetirementConfig() {
  return { retirementAge: 65, expectedReturn: 7, inflationRate: 2.5, lifeExpectancy: 90 };
}

const initialState = {
  plan: createDefaultPlan(),
  incomeConfig: createDefaultIncomeConfig(),
  spAct: Array(12).fill(null),
  userInv: {},
  projRate: 7,
  projYears: 10,
  projMonthly: 0,
  ptSelected: {},
  ptBalances: {},
  ptTxns: [],
  birthYear: 1990,
  retirementAccounts: [],
  retirementConfig: createDefaultRetirementConfig(),
  onboarding: {
    complete: false,
    step: 0,
    focus: 'all',
  },
};

const planVersion = 3;

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString();
}

function fmtS(n) {
  const val = Number(n || 0);
  const a = Math.abs(val);
  const s = val < 0 ? '-' : '';
  if (a >= 1000000) return s + '$' + (a / 1000000).toFixed(3).replace(/\.?0+$/, '') + 'M';
  if (a >= 1000) return s + '$' + (a / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return s + '$' + Math.round(a);
}

function fmtAxis(n) {
  const val = Number(n || 0);
  const a = Math.abs(val);
  const s = val < 0 ? '-' : '';
  if (a >= 1000000) return s + '$' + (a / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (a >= 1000) return s + '$' + Math.round(a / 1000) + 'k';
  return s + '$' + Math.round(a);
}

function fmtD(n) {
  return (n >= 0 ? '+' : '') + fmt(n);
}

function fmtP(n) {
  const val = Number(n || 0);
  const a = Math.abs(val);
  const s = val < 0 ? '-' : '';
  if (a >= 1000000) return s + (a / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (a >= 1000) return s + (a / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return s + Math.round(a).toLocaleString();
}

function allProviders() {
  return Object.values(providers).flatMap((group) => group.items);
}

function providerById(id) {
  return allProviders().find((provider) => provider.id === id);
}

function cleanNumber(value, fallback = null) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function normalizeMonthArray(value, fallback = 0) {
  const source = Array.isArray(value) ? value : [];
  return MONTHS.map((_, i) => {
    const n = Number(source[i]);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  });
}

function normalizeOptionalMonthArray(value) {
  const source = Array.isArray(value) ? value : [];
  return MONTHS.map((_, i) => {
    if (source[i] === null || source[i] === undefined || source[i] === '') return null;
    const n = Number(source[i]);
    return Number.isFinite(n) && n >= 0 ? n : null;
  });
}

function normalizePlan(plan) {
  const defaults = createDefaultPlan();
  const budgetCats = {
    ...defaults.budgetCats,
    ...(plan?.budgetCats && typeof plan.budgetCats === 'object' && !Array.isArray(plan.budgetCats) ? plan.budgetCats : {}),
  };

  return {
    income: normalizeMonthArray(plan?.income),
    investing: normalizeMonthArray(plan?.investing),
    rent: normalizeMonthArray(plan?.rent),
    budgetSp: normalizeMonthArray(plan?.budgetSp),
    fixedInv: normalizeOptionalMonthArray(plan?.fixedInv),
    budgetCats: Object.fromEntries(categoryNames.map((name) => [name, normalizeMonthArray(budgetCats[name])])),
  };
}

function normalizeIncomeConfig(config) {
  const defaults = createDefaultIncomeConfig();
  const frequency = paycheckFrequencies.some((item) => item.key === config?.frequency) ? config.frequency : defaults.frequency;
  return {
    ...defaults,
    ...(config && typeof config === 'object' && !Array.isArray(config) ? config : {}),
    annualSalary: cleanNumber(config?.annualSalary, defaults.annualSalary),
    frequency,
    firstPayDate: typeof config?.firstPayDate === 'string' && config.firstPayDate ? config.firstPayDate : defaults.firstPayDate,
    taxesPerPaycheck: cleanNumber(config?.taxesPerPaycheck, defaults.taxesPerPaycheck),
    fsaPerPaycheck: cleanNumber(config?.fsaPerPaycheck, defaults.fsaPerPaycheck),
    insurancePerPaycheck: cleanNumber(config?.insurancePerPaycheck, defaults.insurancePerPaycheck),
    preTax401kPerPaycheck: cleanNumber(config?.preTax401kPerPaycheck, defaults.preTax401kPerPaycheck),
    afterTaxRothPerPaycheck: cleanNumber(config?.afterTaxRothPerPaycheck, defaults.afterTaxRothPerPaycheck),
    oneTimeEvents: (() => {
      if (Array.isArray(config?.oneTimeEvents) && config.oneTimeEvents.length > 0) {
        return config.oneTimeEvents.map(normalizeOneTimeEvent);
      }
      // migrate from legacy flat arrays if they had data
      const oldGross = Array.isArray(config?.bonusGross) ? config.bonusGross : [];
      const oldTaxes = Array.isArray(config?.bonusTaxes) ? config.bonusTaxes : [];
      const old401k = Array.isArray(config?.bonus401k) ? config.bonus401k : [];
      const oldRoth = Array.isArray(config?.bonusRoth) ? config.bonusRoth : [];
      const migrated = [];
      MONTHS.forEach((month, i) => {
        const gross = Number(oldGross[i]) || 0;
        if (gross > 0) {
          const taxes = Number(oldTaxes[i]) || 0;
          migrated.push(normalizeOneTimeEvent({
            name: `${month} bonus`,
            month: i,
            gross,
            taxRate: gross > 0 ? Math.round((taxes / gross) * 100) : 0,
          }));
        }
      });
      return migrated;
    })(),
  };
}

function normalizeRetirementAccount(acc) {
  return {
    id: (typeof acc.id === 'string' && acc.id) ? acc.id : Math.random().toString(36).slice(2),
    name: typeof acc.name === 'string' ? acc.name : 'Retirement Account',
    type: ACCOUNT_TYPES.some((t) => t.key === acc.type) ? acc.type : 'traditional_401k',
    currentBalance: cleanNumber(acc.currentBalance, 0),
    ytdContributions: cleanNumber(acc.ytdContributions, 0),
    linkedToIncome: Boolean(acc.linkedToIncome),
    manualAnnualContribution: cleanNumber(acc.manualAnnualContribution, 0),
  };
}

function normalizeRetirementConfig(config) {
  const d = createDefaultRetirementConfig();
  return {
    retirementAge: Math.max(50, Math.min(80, Number(config?.retirementAge) || d.retirementAge)),
    expectedReturn: Math.max(0, Math.min(20, Number(config?.expectedReturn) || d.expectedReturn)),
    inflationRate: Math.max(0, Math.min(10, Number(config?.inflationRate) || d.inflationRate)),
    lifeExpectancy: Math.max(70, Math.min(100, Number(config?.lifeExpectancy) || d.lifeExpectancy)),
  };
}

function normalizeDashboardState(payload) {
  const source = payload?.dashboardState && typeof payload.dashboardState === 'object'
    ? payload.dashboardState
    : payload;

  if (!source || typeof source !== 'object' || Array.isArray(source)) return initialState;

  return {
    ...initialState,
    ...source,
    plan: normalizePlan(source.plan),
    incomeConfig: normalizeIncomeConfig(source.incomeConfig),
    spAct: Array.isArray(source.spAct)
      ? source.spAct.slice(0, 12).concat(Array(12).fill(null)).slice(0, 12)
      : initialState.spAct,
    userInv: source.userInv && typeof source.userInv === 'object' && !Array.isArray(source.userInv) ? source.userInv : {},
    ptSelected: source.ptSelected && typeof source.ptSelected === 'object' && !Array.isArray(source.ptSelected) ? source.ptSelected : {},
    ptBalances: source.ptBalances && typeof source.ptBalances === 'object' && !Array.isArray(source.ptBalances) ? source.ptBalances : {},
    ptTxns: Array.isArray(source.ptTxns) ? source.ptTxns : [],
    birthYear: (Number.isFinite(Number(source.birthYear)) && Number(source.birthYear) > 1920 && Number(source.birthYear) < 2010)
      ? Number(source.birthYear) : initialState.birthYear,
    retirementAccounts: Array.isArray(source.retirementAccounts)
      ? source.retirementAccounts.map(normalizeRetirementAccount)
      : [],
    retirementConfig: normalizeRetirementConfig(source.retirementConfig),
    onboarding: {
      ...initialState.onboarding,
      ...(source.onboarding && typeof source.onboarding === 'object' && !Array.isArray(source.onboarding) ? source.onboarding : {}),
    },
  };
}

function packDashboardState(state) {
  return {
    version: planVersion,
    kind: 'finance-dashboard',
    dashboardState: state,
    updatedAt: new Date().toISOString(),
  };
}

function makeScale(series, { includeZero = true } = {}) {
  const values = series.flatMap((item) => (Array.isArray(item) ? item : [item])).filter((v) => v !== null && Number.isFinite(v));
  if (!values.length) return { min: 0, max: 1 };
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (includeZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (min === max) max = min + 1;
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}

function pointsForLine(values, width, height, padding, scale) {
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  return values.map((value, index) => {
    if (value === null || !Number.isFinite(value)) return null;
    const x = padding.left + (values.length === 1 ? innerW / 2 : (index / (values.length - 1)) * innerW);
    const y = padding.top + (1 - (value - scale.min) / (scale.max - scale.min)) * innerH;
    return { x, y, value, index };
  });
}

function toLocalDate(value, fallback = '2026-01-02') {
  const [year, month, day] = String(value || fallback).split('-').map(Number);
  if (!year || !month || !day) return toLocalDate(fallback);
  return new Date(year, month - 1, day);
}

function paycheckCountsByMonth(config, year = 2026) {
  const frequency = paycheckFrequencies.find((item) => item.key === config.frequency) || paycheckFrequencies[2];
  if (frequency.key === 'monthly') return MONTHS.map(() => 1);
  if (frequency.key === 'semimonthly') return MONTHS.map(() => 2);

  const counts = emptyMonths();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const intervalMs = frequency.intervalDays * 24 * 60 * 60 * 1000;
  let payDate = toLocalDate(config.firstPayDate);

  while (payDate > start) payDate = new Date(payDate.getTime() - intervalMs);
  while (payDate < start) payDate = new Date(payDate.getTime() + intervalMs);

  while (payDate <= end) {
    counts[payDate.getMonth()] += 1;
    payDate = new Date(payDate.getTime() + intervalMs);
  }

  return counts;
}

function buildIncomeProjection(config) {
  const frequency = paycheckFrequencies.find((item) => item.key === config.frequency) || paycheckFrequencies[2];
  const paychecks = paycheckCountsByMonth(config);
  const grossPerPaycheck = frequency.checks ? config.annualSalary / frequency.checks : 0;
  let rothYtd = 0;

  const bonusGross = Array(12).fill(0);
  const bonusTaxes = Array(12).fill(0);
  const bonus401k = Array(12).fill(0);
  const bonusRoth = Array(12).fill(0);
  (config.oneTimeEvents || []).forEach((ev) => {
    const m = ev.month;
    bonusGross[m] += ev.gross || 0;
    bonusTaxes[m] += ev.taxWithheld || 0;
  });

  const rows = MONTHS.map((_, i) => {
    const grossSalary = paychecks[i] * grossPerPaycheck;
    const grossBonus = bonusGross[i];
    const totalGross = grossSalary + grossBonus;
    const fsa = paychecks[i] * config.fsaPerPaycheck;
    const taxes = paychecks[i] * config.taxesPerPaycheck + bonusTaxes[i];
    const postTax = totalGross - fsa - taxes;
    const insurance = paychecks[i] * config.insurancePerPaycheck;
    const salary401k = paychecks[i] * config.preTax401kPerPaycheck;
    const bonusMonth401k = bonus401k[i];
    const afterTaxRoth = paychecks[i] * config.afterTaxRothPerPaycheck;
    const bonusMonthRoth = bonusRoth[i];
    rothYtd += salary401k + bonusMonth401k + afterTaxRoth + bonusMonthRoth;
    const postWithholding = postTax - insurance - salary401k - bonusMonth401k - afterTaxRoth - bonusMonthRoth;

    return {
      paychecks: paychecks[i],
      grossSalary,
      grossBonus,
      totalGross,
      fsa,
      taxes,
      postTax,
      insurance,
      salary401k,
      bonus401k: bonusMonth401k,
      afterTaxRoth,
      bonusRoth: bonusMonthRoth,
      rothYtd,
      postWithholding,
    };
  });

  const annual = (key) => rows.reduce((sum, row) => sum + row[key], 0);
  return {
    frequency,
    paychecks,
    grossPerPaycheck,
    rows,
    annual: {
      gross: annual('totalGross'),
      taxes: annual('taxes'),
      postTax: annual('postTax'),
      withholdings: annual('insurance') + annual('salary401k') + annual('bonus401k') + annual('afterTaxRoth') + annual('bonusRoth'),
      postWithholding: annual('postWithholding'),
      rothYtd,
    },
  };
}

function LineChart({ labels, datasets, height = 220, axisFormatter = fmtAxis, includeZero = true }) {
  const width = 900;
  const padding = { top: 14, right: 20, bottom: 28, left: 54 };
  const scale = makeScale(datasets.map((dataset) => dataset.data), { includeZero });
  const grid = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img">
      {grid.map((g) => {
        const y = padding.top + g * (height - padding.top - padding.bottom);
        const value = scale.max - g * (scale.max - scale.min);
        return (
          <g key={g}>
            <line className="grid-line" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text className="axis-label" x={4} y={y + 4}>{axisFormatter(value)}</text>
          </g>
        );
      })}
      {labels.map((label, i) => {
        const x = padding.left + (i / Math.max(1, labels.length - 1)) * (width - padding.left - padding.right);
        return <text className="x-label" key={label + i} x={x} y={height - 6} textAnchor="middle">{label}</text>;
      })}
      {datasets.map((dataset) => {
        const pts = pointsForLine(dataset.data, width, height, padding, scale);
        const segments = [];
        let segment = [];
        pts.forEach((point) => {
          if (point) segment.push(point);
          if (!point && segment.length) {
            segments.push(segment);
            segment = [];
          }
        });
        if (segment.length) segments.push(segment);
        return (
          <g key={dataset.label}>
            {dataset.fill && segments.map((seg, i) => {
              const d = `M ${seg.map((p) => `${p.x},${p.y}`).join(' L ')} L ${seg[seg.length - 1].x},${height - padding.bottom} L ${seg[0].x},${height - padding.bottom} Z`;
              return <path key={i} d={d} fill={dataset.color} opacity="0.12" />;
            })}
            {segments.map((seg, i) => (
              <polyline
                key={i}
                points={seg.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={dataset.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={dataset.dash ? '8 7' : undefined}
              />
            ))}
            {pts.filter(Boolean).map((point) => (
              <circle key={point.index} cx={point.x} cy={point.y} r={dataset.pointRadius || 4} fill={dataset.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function BarChart({ labels, values, colors: barColors, height = 180, axisFormatter = fmtAxis }) {
  const width = 900;
  const padding = { top: 14, right: 20, bottom: 28, left: 54 };
  const scale = makeScale(values);
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const zeroY = padding.top + (1 - (0 - scale.min) / (scale.max - scale.min)) * innerH;
  const barW = innerW / values.length * 0.58;

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img">
      {[0, 0.5, 1].map((g) => {
        const y = padding.top + g * innerH;
        const value = scale.max - g * (scale.max - scale.min);
        return (
          <g key={g}>
            <line className="grid-line" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text className="axis-label" x={4} y={y + 4}>{axisFormatter(value)}</text>
          </g>
        );
      })}
      {labels.map((label, i) => {
        const x = padding.left + (i + 0.5) * (innerW / labels.length);
        return <text className="x-label" key={label} x={x} y={height - 6} textAnchor="middle">{label}</text>;
      })}
      {values.map((value, i) => {
        const x = padding.left + (i + 0.5) * (innerW / values.length) - barW / 2;
        const y = padding.top + (1 - (value - scale.min) / (scale.max - scale.min)) * innerH;
        const top = Math.min(y, zeroY);
        const h = Math.max(2, Math.abs(y - zeroY));
        return <rect key={i} x={x} y={top} width={barW} height={h} rx="4" fill={barColors?.[i] || colors.bank} opacity="0.82" />;
      })}
    </svg>
  );
}

function IncomeAllocationChart({ labels, allocations, height = 250 }) {
  const width = 900;
  const padding = { top: 14, right: 20, bottom: 28, left: 54 };
  const totals = allocations.map((item) => Math.max(item.income, item.investing + item.rent + item.spending + item.leftover));
  const scale = makeScale([allocations.map((item) => item.income), totals]);
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const slotW = innerW / labels.length;
  const barW = slotW * 0.56;
  const zeroY = padding.top + (1 - (0 - scale.min) / (scale.max - scale.min)) * innerH;
  const yFor = (value) => padding.top + (1 - (value - scale.min) / (scale.max - scale.min)) * innerH;

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img">
      {[0, 0.25, 0.5, 0.75, 1].map((g) => {
        const y = padding.top + g * innerH;
        const value = scale.max - g * (scale.max - scale.min);
        return (
          <g key={g}>
            <line className="grid-line" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text className="axis-label" x={4} y={y + 4}>{fmtAxis(value)}</text>
          </g>
        );
      })}
      {labels.map((label, i) => {
        const x = padding.left + (i + 0.5) * slotW;
        return <text className="x-label" key={label} x={x} y={height - 6} textAnchor="middle">{label}</text>;
      })}
      {allocations.map((item, i) => {
        const x = padding.left + i * slotW + (slotW - barW) / 2;
        const segments = [
          { key: 'investing', value: item.investing, color: colors.invest },
          { key: 'rent', value: item.rent, color: colors.rent },
          { key: 'spending', value: item.spending, color: colors.spend },
          { key: 'leftover', value: item.leftover, color: colors.cf },
        ];
        let cursor = 0;
        return (
          <g key={labels[i]}>
            {segments.map((segment) => {
              if (segment.value <= 0) return null;
              const start = cursor;
              cursor += segment.value;
              const y = yFor(cursor);
              const h = Math.max(2, yFor(start) - y);
              return <rect key={segment.key} x={x} y={y} width={barW} height={h} fill={segment.color} opacity="0.84" />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

function SankeyAllocationChart({ items, sourceLabel = 'Income', height = 270 }) {
  const width = 900;
  const padding = { top: 24, right: 52, bottom: 24, left: 52 };
  const usableH = height - padding.top - padding.bottom;
  const positiveItems = items.filter((item) => item.value > 0);
  const total = positiveItems.reduce((sum, item) => sum + item.value, 0);
  const maxNodeH = usableH * 0.72;
  const scale = total > 0 ? maxNodeH / total : 0;
  const nodeW = 18;
  const sourceX = padding.left + 58;
  const targetX = width - padding.right - 190;
  const gap = 14;
  const minTargetH = 22;
  const displayedItems = positiveItems.map((item) => ({ ...item, h: Math.max(minTargetH, item.value * scale) }));
  const displayedTotalH = displayedItems.reduce((sum, item) => sum + item.h, 0);
  const sourceH = Math.max(28, displayedTotalH);
  const sourceY = padding.top + (usableH - sourceH) / 2;
  const targetTotalH = displayedTotalH + Math.max(0, displayedItems.length - 1) * gap;
  let targetCursor = padding.top + (usableH - targetTotalH) / 2;
  let sourceCursor = sourceY;

  if (!positiveItems.length) {
    return <div className="empty">Add income and allocations to see the annual flow.</div>;
  }

  return (
    <svg className="chart sankey-chart" viewBox={`0 0 ${width} ${height}`} role="img">
      <defs>
        <filter id="sankeySoftShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.12" />
        </filter>
      </defs>
      {displayedItems.map((item) => {
        const sy = sourceCursor + item.h / 2;
        const targetH = item.h;
        const ty = targetCursor + targetH / 2;
        const path = `M ${sourceX + nodeW} ${sy} C ${sourceX + 220} ${sy}, ${targetX - 220} ${ty}, ${targetX} ${ty}`;
        sourceCursor += item.h;
        const node = { ...item, y: targetCursor, path };
        targetCursor += targetH + gap;
        return (
          <g key={item.label}>
            <path d={node.path} fill="none" stroke={node.color} strokeWidth={node.h} strokeOpacity="0.24" strokeLinecap="butt" />
            <rect x={targetX} y={node.y} width={nodeW} height={node.h} fill={node.color} filter="url(#sankeySoftShadow)" />
            <text className="sankey-label" x={targetX + nodeW + 12} y={node.y + node.h / 2 - 2}>{node.label}</text>
            <text className="sankey-value" x={targetX + nodeW + 12} y={node.y + node.h / 2 + 16}>{fmtS(node.value)}</text>
          </g>
        );
      })}
      <rect x={sourceX} y={sourceY} width={nodeW} height={sourceH} fill={colors.income} filter="url(#sankeySoftShadow)" />
      <text className="sankey-source-label" x={sourceX - 12} y={sourceY + sourceH / 2 - 2} textAnchor="end">{sourceLabel}</text>
      <text className="sankey-source-value" x={sourceX - 12} y={sourceY + sourceH / 2 + 16} textAnchor="end">{fmtS(total)}</text>
    </svg>
  );
}

function DonutChart({ data, labels, palette }) {
  const total = data.reduce((sum, value) => sum + Math.max(0, value), 0);
  const radius = 76;
  const center = 100;
  let cursor = -90;

  function arc(value, index) {
    const angle = total ? (Math.max(0, value) / total) * 360 : 0;
    if (angle >= 359.99) {
      cursor += angle;
      return <circle key={labels[index]} cx={center} cy={center} r={radius} fill={palette[index]} />;
    }
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    const large = angle > 180 ? 1 : 0;
    const sx = center + radius * Math.cos((Math.PI * start) / 180);
    const sy = center + radius * Math.sin((Math.PI * start) / 180);
    const ex = center + radius * Math.cos((Math.PI * end) / 180);
    const ey = center + radius * Math.sin((Math.PI * end) / 180);
    return <path key={labels[index]} d={`M ${center} ${center} L ${sx} ${sy} A ${radius} ${radius} 0 ${large} 1 ${ex} ${ey} Z`} fill={palette[index]} />;
  }

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 200 200" className="donut" role="img">
        <circle cx={center} cy={center} r={radius} fill="var(--bg-tertiary)" />
        {total > 0 ? data.map(arc) : null}
        <circle cx={center} cy={center} r="46" fill="var(--bg-primary)" />
        <text x="100" y="96" textAnchor="middle" className="donut-total">{fmtP(total)}</text>
        <text x="100" y="114" textAnchor="middle" className="donut-label">points</text>
      </svg>
      <div className="donut-legend">
        {labels.map((label, i) => (
          <span key={label}><span className="leg-dot" style={{ background: palette[i] }} />{label}</span>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, sub, tone }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${tone ? `tone-${tone}` : ''}`}>{value}</div>
      {sub ? <div className={`metric-sub ${tone === 'danger' ? 'sub-danger' : tone === 'good' ? 'sub-good' : ''}`}>{sub}</div> : null}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((item) => (
        <span key={item.label}><span className="leg-dot" style={{ background: item.color, opacity: item.opacity ?? 1 }} />{item.label}</span>
      ))}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div className="section-title">{children}</div>;
}

export default function BalancePlanner() {
  const [state, setState] = useState(initialState);
  const [loaded, setLoaded] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveLabel, setSaveLabel] = useState('Saved');
  const [user, setUser] = useState(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState({
    tone: 'muted',
    label: 'Checking cloud',
    detail: 'Looking for Neon-backed storage.',
  });
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [activeMain, setActiveMain] = useState('overview');
  const [activeSub, setActiveSub] = useState('balances');
  const [activePtCat, setActivePtCat] = useState('cc');
  const [txnDraft, setTxnDraft] = useState({ provider: '', desc: '', pts: '' });
  const savePulseTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrateCloudPlan() {
      try {
        const storage = await fetch('/api/storage/status', { cache: 'no-store' });
        if (cancelled) return;

        if (storage.status === 503) {
          setStorageStatus({
            tone: 'warn',
            label: 'Cloud unavailable',
            detail: 'Add DATABASE_URL or POSTGRES_URL to use this cloud-only app.',
          });
          setCloudReady(false);
          setCheckedStorage(true);
          setLoaded(true);
          return;
        }

        if (!storage.ok) {
          setStorageStatus({
            tone: 'warn',
            label: 'Cloud unavailable',
            detail: 'Neon is configured, but the database check failed.',
          });
          setCloudReady(false);
          setCheckedStorage(true);
          setLoaded(true);
          return;
        }
        setCheckedStorage(true);

        const session = await fetch('/api/auth/session', { cache: 'no-store' });
        if (cancelled) return;

        const sessionData = await session.json().catch(() => ({}));
        if (!session.ok || !sessionData.authenticated) {
          setStorageStatus({
            tone: 'muted',
            label: 'Cloud ready',
            detail: 'Sign in or create an account to continue.',
          });
          setCloudReady(false);
          setLoaded(true);
          return;
        }

        setUser(sessionData.user);
        setStorageStatus({
          tone: 'muted',
          label: 'Loading cloud',
          detail: 'Pulling your saved dashboard from Neon.',
        });

        const planResponse = await fetch('/api/plan', { cache: 'no-store' });
        const planData = await planResponse.json().catch(() => ({}));
        if (cancelled) return;

        if (planResponse.ok && planData.data) {
          setState(normalizeDashboardState(planData.data));
        }

        setCloudReady(true);
        setStorageStatus({
          tone: 'good',
          label: planResponse.ok ? 'Cloud database' : 'Cloud connected',
          detail: planResponse.ok ? 'Synced with Neon Postgres.' : 'Signed in; cloud saves will retry.',
        });
        setLoaded(true);
      } catch (error) {
        if (cancelled) return;
        console.warn('Could not check cloud storage', error);
        setStorageStatus({
          tone: 'warn',
          label: 'Cloud unavailable',
          detail: 'Neon cloud storage is unavailable in this session.',
        });
        setCloudReady(false);
        setCheckedStorage(true);
        setLoaded(true);
      }
    }

    hydrateCloudPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded || !cloudReady || !user) return undefined;
    const timer = window.setTimeout(() => {
      showSaved('Saving...');
      fetch('/api/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packDashboardState(state)),
      })
        .then(async (response) => {
          if (response.status === 401) {
            setUser(null);
            setCloudReady(false);
            setStorageStatus({
              tone: 'muted',
              label: 'Cloud ready',
              detail: 'Session expired. Sign in again to resume.',
            });
            return;
          }

          if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Cloud save failed');
          setStorageStatus({
            tone: 'good',
            label: 'Cloud database',
            detail: 'Synced with Neon Postgres.',
          });
          showSaved('Cloud saved');
        })
        .catch((error) => {
          console.warn('Could not save dashboard state to cloud', error);
          setStorageStatus({
            tone: 'warn',
            label: 'Cloud save failed',
            detail: 'Changes could not be saved to Neon.',
          });
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [cloudReady, loaded, state, user]);

  function showSaved(label) {
    setSaveLabel(label);
    setSaved(true);
    if (savePulseTimer.current) window.clearTimeout(savePulseTimer.current);
    savePulseTimer.current = window.setTimeout(() => setSaved(false), 1400);
  }

  const plan = state.plan;
  const incomeProjection = useMemo(() => buildIncomeProjection(state.incomeConfig), [state.incomeConfig]);

  const derived = useMemo(() => {
    const effectiveSpend = (i) => (state.spAct[i] !== null && state.spAct[i] !== undefined ? state.spAct[i] : plan.budgetSp[i]);
    const effectiveCashflow = (i) => plan.income[i] - plan.investing[i] - plan.rent[i] - effectiveSpend(i);
    const bank = MONTHS.map((_, i) => {
      let sum = 0;
      for (let j = 0; j <= i; j += 1) sum += effectiveCashflow(j);
      return Math.round(sum);
    });
    const getInv = (i) => (state.userInv[i] !== undefined ? state.userInv[i] : plan.fixedInv[i]);
    let anchor = { index: 0, balance: 0 };
    for (let i = 11; i >= 0; i -= 1) {
      const value = getInv(i);
      if (value !== null && value !== undefined) {
        anchor = { index: i, balance: value };
        break;
      }
    }
    const monthlyRate = state.projRate / 100 / 12;
    const proj26 = Array(12).fill(null);
    for (let i = 0; i <= anchor.index; i += 1) {
      const value = getInv(i);
      if (value !== null && value !== undefined) proj26[i] = value;
    }
    let balance = anchor.balance;
    for (let i = anchor.index + 1; i < 12; i += 1) {
      balance = balance * (1 + monthlyRate) + state.projMonthly;
      proj26[i] = Math.round(balance);
    }
    return { effectiveSpend, effectiveCashflow, bank, getInv, anchor, proj26 };
  }, [plan, state.projMonthly, state.projRate, state.spAct, state.userInv]);

  const selectedProviders = useMemo(() => allProviders().filter((provider) => state.ptSelected[provider.id]), [state.ptSelected]);
  const getStartBal = (id) => state.ptBalances[id] || 0;
  const getBal = (id) => getStartBal(id) + state.ptTxns.filter((txn) => txn.provider === id).reduce((sum, txn) => sum + txn.pts, 0);

  function patchState(patch) {
    setState((current) => ({ ...current, ...patch }));
  }

  function patchIncomeConfig(patch) {
    setState((current) => ({
      ...current,
      incomeConfig: normalizeIncomeConfig({ ...current.incomeConfig, ...patch }),
    }));
  }

  function addOneTimeEvent(ev) {
    setState((current) => ({
      ...current,
      incomeConfig: normalizeIncomeConfig({
        ...current.incomeConfig,
        oneTimeEvents: [...(current.incomeConfig.oneTimeEvents || []), ev],
      }),
    }));
  }

  function updateOneTimeEvent(id, patch) {
    setState((current) => ({
      ...current,
      incomeConfig: normalizeIncomeConfig({
        ...current.incomeConfig,
        oneTimeEvents: (current.incomeConfig.oneTimeEvents || []).map((ev) =>
          ev.id === id ? { ...ev, ...patch } : ev
        ),
      }),
    }));
  }

  function removeOneTimeEvent(id) {
    setState((current) => ({
      ...current,
      incomeConfig: normalizeIncomeConfig({
        ...current.incomeConfig,
        oneTimeEvents: (current.incomeConfig.oneTimeEvents || []).filter((ev) => ev.id !== id),
      }),
    }));
  }

  function applyIncomeToPlan() {
    setState((current) => {
      const projection = buildIncomeProjection(current.incomeConfig);
      return {
        ...current,
        plan: {
          ...current.plan,
          income: projection.rows.map((row) => Math.max(0, Math.round(row.postWithholding))),
        },
      };
    });
    showSaved('Income applied');
  }

  function setSpAct(i, value) {
    const next = cleanNumber(value);
    setState((current) => {
      const spAct = [...current.spAct];
      spAct[i] = next;
      return { ...current, spAct };
    });
  }

  function setInvAct(i, value) {
    const next = cleanNumber(value);
    setState((current) => {
      const userInv = { ...current.userInv };
      if (next && next > 0) userInv[i] = next;
      else delete userInv[i];
      return { ...current, userInv };
    });
  }

  function addRetirementAccount(acc) {
    setState((cur) => ({ ...cur, retirementAccounts: [...cur.retirementAccounts, normalizeRetirementAccount(acc)] }));
  }

  function updateRetirementAccount(id, patch) {
    setState((cur) => ({
      ...cur,
      retirementAccounts: cur.retirementAccounts.map((a) => a.id === id ? normalizeRetirementAccount({ ...a, ...patch }) : a),
    }));
  }

  function removeRetirementAccount(id) {
    setState((cur) => ({ ...cur, retirementAccounts: cur.retirementAccounts.filter((a) => a.id !== id) }));
  }

  function patchRetirementConfig(patch) {
    setState((cur) => ({ ...cur, retirementConfig: normalizeRetirementConfig({ ...cur.retirementConfig, ...patch }) }));
  }

  function toggleProvider(id) {
    setState((current) => {
      const ptSelected = { ...current.ptSelected, [id]: !current.ptSelected[id] };
      const ptBalances = { ...current.ptBalances };
      if (!ptSelected[id]) delete ptBalances[id];
      return { ...current, ptSelected, ptBalances };
    });
  }

  function setPtBal(id, value) {
    const next = cleanNumber(value, 0);
    setState((current) => ({ ...current, ptBalances: { ...current.ptBalances, [id]: next } }));
  }

  function addTxn(event) {
    event.preventDefault();
    const provider = txnDraft.provider || selectedProviders[0]?.id;
    const pts = Number(txnDraft.pts);
    if (!provider || !Number.isFinite(pts)) return;
    setState((current) => ({
      ...current,
      ptTxns: [
        ...current.ptTxns,
        {
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
          provider,
          pts: Math.round(pts),
          desc: txnDraft.desc.trim() || 'Manual adjustment',
          date: new Date().toISOString().slice(0, 10),
        },
      ],
    }));
    setTxnDraft({ provider, desc: '', pts: '' });
  }

  function deleteTxn(id) {
    setState((current) => ({ ...current, ptTxns: current.ptTxns.filter((txn) => txn.id !== id) }));
  }

  async function handleAuth(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await fetch(`/api/auth/${authMode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not sign in.');

      setUser(data.user);
      setCloudReady(true);
      setStorageStatus({
        tone: 'good',
        label: 'Cloud database',
        detail: 'Signed in. This dashboard now saves to Neon.',
      });

      const planResponse = await fetch('/api/plan', { cache: 'no-store' });
      const planData = await planResponse.json().catch(() => ({}));
      if (planResponse.ok && planData.data) setState(normalizeDashboardState(planData.data));
      else showSaved('Cloud ready');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    setUser(null);
    setCloudReady(false);
    setStorageStatus({
      tone: 'muted',
      label: 'Cloud ready',
      detail: 'Signed out. Sign in to access your dashboard.',
    });
  }

  if (!loaded) {
    return (
      <div className="dashboard-shell auth-shell">
        <style>{appStyles}</style>
        <AuthScreen
          storageStatus={storageStatus}
          authMode={authMode}
          setAuthMode={setAuthMode}
          authForm={authForm}
          setAuthForm={setAuthForm}
          authError={authError}
          authBusy={authBusy}
          handleAuth={handleAuth}
          loading
        />
      </div>
    );
  }

  if (!checkedStorage || (!user && storageStatus.tone === 'warn')) {
    return (
      <div className="dashboard-shell auth-shell">
        <style>{appStyles}</style>
        <AuthScreen
          storageStatus={storageStatus}
          authMode={authMode}
          setAuthMode={setAuthMode}
          authForm={authForm}
          setAuthForm={setAuthForm}
          authError={authError}
          authBusy={authBusy}
          handleAuth={handleAuth}
          storageBlocked
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-shell auth-shell">
        <style>{appStyles}</style>
        <AuthScreen
          storageStatus={storageStatus}
          authMode={authMode}
          setAuthMode={setAuthMode}
          authForm={authForm}
          setAuthForm={setAuthForm}
          authError={authError}
          authBusy={authBusy}
          handleAuth={handleAuth}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <style>{appStyles}</style>
      <header className="app-header">
        <div>
          <p className="eyebrow">Balance Tracker</p>
          <h1>2026 Finance Dashboard</h1>
        </div>
        <div className="header-status">
          <span className={`cloud-pill ${storageStatus.tone}`}>{storageStatus.label}</span>
          <span className={`save-indicator ${saved ? 'show' : ''}`}>{saveLabel}</span>
          <button className="link-button" type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {!state.onboarding?.complete ? (
        <OnboardingFlow
          state={state}
          setState={setState}
          storageStatus={storageStatus}
        />
      ) : (
        <>
          <nav className="tabs" aria-label="Dashboard sections">
            {mainTabs.map((tab) => (
              <button key={tab.key} className={`tab ${activeMain === tab.key ? 'active' : ''}`} onClick={() => setActiveMain(tab.key)}>
                {tab.label}
              </button>
            ))}
          </nav>

          <main>
            {activeMain === 'overview' ? <Overview derived={derived} state={state} plan={plan} /> : null}
            {activeMain === 'income' ? (
              <Income
                config={state.incomeConfig}
                projection={incomeProjection}
                plan={plan}
                patchConfig={patchIncomeConfig}
                applyIncomeToPlan={applyIncomeToPlan}
                onAddEvent={addOneTimeEvent}
                onUpdateEvent={updateOneTimeEvent}
                onRemoveEvent={removeOneTimeEvent}
              />
            ) : null}
            {activeMain === 'spending' ? <Spending state={state} plan={plan} setSpAct={setSpAct} /> : null}
            {activeMain === 'investments' ? <Investments state={state} derived={derived} plan={plan} setInvAct={setInvAct} /> : null}
            {activeMain === 'retirement' ? (
              <Retirement
                state={state}
                incomeProjection={incomeProjection}
                patchState={patchState}
                addAccount={addRetirementAccount}
                updateAccount={updateRetirementAccount}
                removeAccount={removeRetirementAccount}
                patchConfig={patchRetirementConfig}
              />
            ) : null}
            {activeMain === 'projection' ? <Projection state={state} derived={derived} plan={plan} patchState={patchState} setInvAct={setInvAct} /> : null}
            {activeMain === 'points' ? (
              <Points
                activeSub={activeSub}
                setActiveSub={setActiveSub}
                activePtCat={activePtCat}
                setActivePtCat={setActivePtCat}
                selectedProviders={selectedProviders}
                state={state}
                txnDraft={txnDraft}
                setTxnDraft={setTxnDraft}
                getBal={getBal}
                getStartBal={getStartBal}
                toggleProvider={toggleProvider}
                setPtBal={setPtBal}
                addTxn={addTxn}
                deleteTxn={deleteTxn}
              />
            ) : null}
          </main>
        </>
      )}
    </div>
  );
}

function AuthScreen(props) {
  const {
    storageStatus, authMode, setAuthMode, authForm, setAuthForm, authError,
    authBusy, handleAuth, loading = false, storageBlocked = false,
  } = props;

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div>
          <SectionTitle>{authMode === 'register' ? 'Create account' : 'Sign in'}</SectionTitle>
          <p className="helper-text">
            {loading ? 'Checking Neon and your session.' : storageBlocked ? 'Cloud storage must be available before the dashboard can open.' : ''}
          </p>
        </div>
        <form className="auth-screen-form" onSubmit={handleAuth}>
          <label>
            <span className="form-label">Email</span>
            <input
              type="email"
              value={authForm.email}
              disabled={loading || storageBlocked}
              onChange={(event) => setAuthForm((form) => ({ ...form, email: event.target.value }))}
            />
          </label>
          <label>
            <span className="form-label">Password</span>
            <input
              type="password"
              value={authForm.password}
              disabled={loading || storageBlocked}
              placeholder={authMode === 'register' ? '12 characters minimum' : ''}
              onChange={(event) => setAuthForm((form) => ({ ...form, password: event.target.value }))}
            />
          </label>
          {authError ? <div className="auth-error">{authError}</div> : null}
          <button className="btn primary-btn" type="submit" disabled={loading || storageBlocked || authBusy}>
            {authBusy ? 'Working' : authMode === 'register' ? 'Create account' : 'Sign in'}
          </button>
          <button className="link-button" type="button" disabled={loading || storageBlocked} onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>
            {authMode === 'register' ? 'Already have an account?' : 'Need an account?'}
          </button>
        </form>
      </section>
    </main>
  );
}

function OnboardingFlow({ state, setState, storageStatus }) {
  const step = Math.min(Math.max(Number(state.onboarding?.step || 0), 0), onboardingSteps.length - 1);
  const focus = state.onboarding?.focus || 'all';
  const commonProviders = ['chase', 'amex', 'bilt', 'hyatt', 'united', 'american'];
  const plan = state.plan;

  function patchOnboarding(patch) {
    setState((current) => ({
      ...current,
      onboarding: {
        ...initialState.onboarding,
        ...current.onboarding,
        ...patch,
      },
    }));
  }

  function go(nextStep) {
    patchOnboarding({ step: Math.min(Math.max(nextStep, 0), onboardingSteps.length - 1) });
  }

  function finish() {
    patchOnboarding({ complete: true, step });
  }

  function setProjection(patch) {
    setState((current) => ({ ...current, ...patch }));
  }

  function setPlanMonth(field, index, value, optional = false) {
    const next = optional ? normalizeOptionalMonthArray([...[...Array(index)].map(() => undefined), value])[index] : cleanNumber(value, 0);
    setState((current) => {
      const values = [...current.plan[field]];
      values[index] = next;
      return { ...current, plan: { ...current.plan, [field]: values } };
    });
  }

  function setCategoryMonth(category, index, value) {
    const next = cleanNumber(value, 0);
    setState((current) => {
      const values = [...current.plan.budgetCats[category]];
      values[index] = next;
      return {
        ...current,
        plan: {
          ...current.plan,
          budgetCats: {
            ...current.plan.budgetCats,
            [category]: values,
          },
        },
      };
    });
  }

  function setQuickSpend(index, value) {
    const next = cleanNumber(value);
    setState((current) => {
      const spAct = [...current.spAct];
      spAct[index] = next;
      return { ...current, spAct };
    });
  }

  function setQuickInv(index, value) {
    const next = cleanNumber(value);
    setState((current) => {
      const userInv = { ...current.userInv };
      if (next && next > 0) userInv[index] = next;
      else delete userInv[index];
      return { ...current, userInv };
    });
  }

  function toggleQuickProvider(id) {
    setState((current) => {
      const selected = !current.ptSelected[id];
      const ptSelected = { ...current.ptSelected, [id]: selected };
      const ptBalances = { ...current.ptBalances };
      if (!selected) delete ptBalances[id];
      return { ...current, ptSelected, ptBalances };
    });
  }

  function setQuickProviderBalance(id, value) {
    const next = cleanNumber(value, 0);
    setState((current) => ({ ...current, ptBalances: { ...current.ptBalances, [id]: next } }));
  }

  return (
    <section className="onboarding-card">
      <div className="onboarding-head">
        <div>
          <p className="eyebrow">Setup</p>
          <h2>{onboardingSteps[step]}</h2>
        </div>
        <button className="link-button" type="button" onClick={finish}>Skip setup</button>
      </div>
      <div className="stepper">
        {onboardingSteps.map((label, i) => (
          <button key={label} className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} type="button" onClick={() => go(i)}>
            <span>{i + 1}</span>{label}
          </button>
        ))}
      </div>

      {step === 0 ? (
        <div className="onboarding-grid">
          {[
            ['all', 'Full command center', 'Cashflow, investments, and points in one daily view.'],
            ['cashflow', 'Cashflow first', 'Prioritize spending corrections and the year-end bank floor.'],
            ['investing', 'Investment tracking', 'Keep the anchor fresh and tune long-term assumptions.'],
            ['points', 'Points & miles', 'Track balances and redemptions across loyalty programs.'],
          ].map(([key, title, copy]) => (
            <button key={key} className={`choice-card ${focus === key ? 'active' : ''}`} type="button" onClick={() => patchOnboarding({ focus: key })}>
              <strong>{title}</strong>
              <span>{copy}</span>
            </button>
          ))}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="setup-stack">
          <p className="helper-text">Set the core monthly model. These values drive the overview, running bank balance, and spending baseline.</p>
          <MonthlyPlanEditor
            rows={[
              ['income', 'Income', plan.income],
              ['investing', 'Investing', plan.investing],
              ['rent', 'Rent', plan.rent],
              ['budgetSp', 'Spend budget', plan.budgetSp],
            ]}
            onChange={setPlanMonth}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="setup-stack">
          <p className="helper-text">Set monthly category budgets. These power the annual category bars.</p>
          <CategoryPlanEditor budgetCats={plan.budgetCats} onChange={setCategoryMonth} />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="setup-stack">
          <p className="helper-text">Add known spending actuals and end-of-month investment balances. Blank months stay projected.</p>
          <MonthlyPlanEditor
            rows={[
              ['spAct', 'Actual spend', state.spAct],
              ['fixedInv', 'Investment balance', plan.fixedInv],
            ]}
            onChange={(field, index, value) => {
              if (field === 'spAct') setQuickSpend(index, value);
              else setPlanMonth(field, index, value, true);
            }}
            optional
          />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="setup-stack">
          <Slider label="Annual return" value={state.projRate} min={0} max={20} step={0.5} display={`${state.projRate.toFixed(1)}%`} onChange={(value) => setProjection({ projRate: value })} />
          <Slider label="Years to project" value={state.projYears} min={1} max={30} step={1} display={`${state.projYears} yrs`} onChange={(value) => setProjection({ projYears: value })} />
          <Slider label="Monthly add" value={state.projMonthly} min={0} max={15000} step={500} display={fmt(state.projMonthly)} onChange={(value) => setProjection({ projMonthly: value })} />
        </div>
      ) : null}

      {step === 5 ? (
        <div className="setup-stack">
          <p className="helper-text">Pick the programs you actually care about. You can add the rest later.</p>
          <div className="quick-provider-grid">
            {commonProviders.map((id) => {
              const provider = providerById(id);
              const selected = Boolean(state.ptSelected[id]);
              return (
                <div className={`quick-provider ${selected ? 'selected' : ''}`} key={id}>
                  <button type="button" onClick={() => toggleQuickProvider(id)}>
                    <span className="bdot" style={{ background: provider.color }} />{provider.name}
                  </button>
                  {selected ? <input type="number" min="0" placeholder="starting pts" value={state.ptBalances[id] || ''} onChange={(event) => setQuickProviderBalance(id, event.target.value)} /> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 6 ? (
        <div className="review-grid">
          <Metric label="Focus" value={focus === 'all' ? 'Full' : focus} sub="onboarding preference" />
          <Metric label="Storage" value="Cloud" sub={storageStatus.label} tone="good" />
          <Metric label="Projection" value={`${state.projRate.toFixed(1)}%`} sub={`${fmt(state.projMonthly)} monthly`} />
          <Metric label="Programs" value={Object.values(state.ptSelected).filter(Boolean).length} sub="selected" />
        </div>
      ) : null}

      <div className="onboarding-actions">
        <button className="btn" type="button" onClick={() => go(step - 1)} disabled={step === 0}>Back</button>
        {step < onboardingSteps.length - 1 ? (
          <button className="btn primary-btn" type="button" onClick={() => go(step + 1)}>Continue</button>
        ) : (
          <button className="btn primary-btn" type="button" onClick={finish}>Open dashboard</button>
        )}
      </div>
    </section>
  );
}

function parseTsvCell(raw) {
  return raw.replace(/[$,\s]/g, '');
}

function MonthlyPlanEditor({ rows, onChange, optional = false }) {
  function handlePaste(rowIndex, startCol, event) {
    const text = event.clipboardData.getData('text');
    if (!text.includes('\t')) return;
    event.preventDefault();
    const pastedRows = text.trimEnd().split('\n').map((r) => r.split('\t'));
    pastedRows.forEach((cells, rowOffset) => {
      const target = rows[rowIndex + rowOffset];
      if (!target) return;
      const [field] = target;
      cells.forEach((cell, colOffset) => {
        const col = startCol + colOffset;
        if (col < 12) onChange(field, col, parseTsvCell(cell));
      });
    });
  }

  return (
    <div className="matrix-wrap">
      <div className="month-matrix">
        <div className="matrix-row matrix-head">
          <span />
          {MONTHS.map((month) => <span key={month}>{month}</span>)}
        </div>
        {rows.map(([field, label, values], rowIndex) => (
          <div className="matrix-row" key={field}>
            <strong>{label}</strong>
            {MONTHS.map((month, index) => (
              <input
                key={month}
                type="number"
                min="0"
                value={values[index] ?? ''}
                placeholder={optional ? '-' : '0'}
                onChange={(event) => onChange(field, index, event.target.value)}
                onPaste={(event) => handlePaste(rowIndex, index, event)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryPlanEditor({ budgetCats, onChange }) {
  function handlePaste(catIndex, startCol, event) {
    const text = event.clipboardData.getData('text');
    if (!text.includes('\t')) return;
    event.preventDefault();
    const pastedRows = text.trimEnd().split('\n').map((r) => r.split('\t'));
    pastedRows.forEach((cells, rowOffset) => {
      const category = categoryNames[catIndex + rowOffset];
      if (!category) return;
      cells.forEach((cell, colOffset) => {
        const col = startCol + colOffset;
        if (col < 12) onChange(category, col, parseTsvCell(cell));
      });
    });
  }

  return (
    <div className="matrix-wrap">
      <div className="month-matrix category-matrix">
        <div className="matrix-row matrix-head">
          <span>Category</span>
          {MONTHS.map((month) => <span key={month}>{month}</span>)}
        </div>
        {categoryNames.map((category, catIndex) => (
          <div className="matrix-row" key={category}>
            <strong>{category}</strong>
            {MONTHS.map((month, index) => (
              <input
                key={month}
                type="number"
                min="0"
                value={budgetCats[category]?.[index] ?? 0}
                onChange={(event) => onChange(category, index, event.target.value)}
                onPaste={(event) => handlePaste(catIndex, index, event)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Overview({ derived, state, plan }) {
  const [allocationView, setAllocationView] = useState('monthly');
  const totalIncome = plan.income.reduce((sum, value) => sum + value, 0);
  const totalInvested = plan.investing.reduce((sum, value) => sum + value, 0);
  const totalRent = plan.rent.reduce((sum, value) => sum + value, 0);
  const totalSpending = MONTHS.reduce((sum, _, i) => sum + derived.effectiveSpend(i), 0);
  const entered = state.spAct.filter((value) => value !== null && value !== undefined).length;
  const cashflow = MONTHS.map((_, i) => derived.effectiveCashflow(i));
  const allocations = MONTHS.map((_, i) => ({
    income: plan.income[i],
    investing: plan.investing[i],
    rent: plan.rent[i],
    spending: derived.effectiveSpend(i),
    leftover: Math.max(0, derived.effectiveCashflow(i)),
  }));
  const annualCashflow = cashflow.reduce((sum, value) => sum + value, 0);
  const sankeyItems = [
    { label: 'Invested', value: totalInvested, color: colors.invest },
    { label: 'Rent', value: totalRent, color: colors.rent },
    { label: 'Spending', value: totalSpending, color: colors.spend },
    ...(annualCashflow >= 0 ? [{ label: 'Leftover cashflow', value: annualCashflow, color: colors.cf }] : []),
  ];

  return (
    <>
      <div className="metrics">
        <Metric label="Annual income" value={fmtS(totalIncome)} sub="post-tax plan" />
        <Metric label="Total invested" value={fmtS(totalInvested)} sub="401k + brokerage" />
        <Metric label="Total rent" value={fmtS(totalRent)} sub="incl. utilities" />
        <Metric label="Spending" value={fmtS(totalSpending)} sub={entered ? `${entered} months corrected` : 'budgeted'} />
        <Metric label="Year-end bank" value={fmtS(derived.bank[11])} sub="uninvested cashflow" tone={derived.bank[11] >= 0 ? 'good' : 'danger'} />
      </div>
      <div className="overview-chart-head">
        <Legend items={[
          { label: 'Invested', color: colors.invest },
          { label: 'Rent', color: colors.rent },
          { label: 'Spending', color: colors.spend },
          ...(annualCashflow >= 0 ? [{ label: 'Leftover cashflow', color: colors.cf }] : []),
        ]} />
        <div className="segmented" role="group" aria-label="Allocation view">
          <button type="button" className={allocationView === 'monthly' ? 'active' : ''} onClick={() => setAllocationView('monthly')}>Monthly</button>
          <button type="button" className={allocationView === 'annual' ? 'active' : ''} onClick={() => setAllocationView('annual')}>Annual</button>
        </div>
      </div>
      <div className="chart-wrap tall">
        {allocationView === 'annual' ? (
          <SankeyAllocationChart items={sankeyItems} sourceLabel={annualCashflow >= 0 ? 'Income' : 'Income + shortfall'} height={270} />
        ) : (
          <IncomeAllocationChart
            labels={MONTHS}
            allocations={allocations}
            height={250}
          />
        )}
      </div>
      <div className="two-col">
        <div className="card">
          <SectionTitle>Bank balance running</SectionTitle>
          <LineChart labels={MONTHS} datasets={[{ label: 'Bank', data: derived.bank, color: colors.bank, fill: true }]} height={160} includeZero={false} />
        </div>
        <div className="card">
          <SectionTitle>Monthly cashflow</SectionTitle>
          <BarChart labels={MONTHS} values={cashflow} colors={cashflow.map((value) => (value >= 0 ? colors.cf : colors.rent))} height={160} />
        </div>
      </div>
    </>
  );
}

function EventEditForm({ draft, patchDraft, onSave, onCancel }) {
  const gross = cleanNumber(draft.gross, 0);
  const tax = cleanNumber(draft.taxWithheld, 0);
  const net = gross - tax;
  const effectiveRate = gross > 0 ? (tax / gross * 100).toFixed(1) : '—';

  return (
    <div className="event-form">
      <div className="event-form-top">
        <label>
          <span className="form-label">Event name</span>
          <input type="text" value={draft.name} placeholder="Annual bonus" autoFocus onChange={(e) => patchDraft({ name: e.target.value })} />
        </label>
        <label>
          <span className="form-label">Month</span>
          <select value={draft.month} onChange={(e) => patchDraft({ month: Number(e.target.value) })}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </label>
      </div>
      <div className="event-form-amounts">
        <label>
          <span className="form-label">Gross amount</span>
          <input type="number" min="0" step="100" value={draft.gross} placeholder="20000" onChange={(e) => patchDraft({ gross: e.target.value })} />
        </label>
        <label>
          <span className="form-label">Tax withheld</span>
          <input type="number" min="0" step="100" value={draft.taxWithheld} placeholder="7400" onChange={(e) => patchDraft({ taxWithheld: e.target.value })} />
        </label>
        <div className="event-computed-field">
          <span className="form-label">Effective rate</span>
          <span className="event-computed-val">{effectiveRate}{gross > 0 ? '%' : ''}</span>
        </div>
        <div className="event-computed-field">
          <span className="form-label">Take-home</span>
          <span className={`event-computed-val${net >= 0 ? ' event-net-positive' : ''}`}>{fmtS(net)}</span>
        </div>
      </div>
      <div className="event-form-actions">
        <button className="btn" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn primary-btn" type="button" onClick={onSave}>Save event</button>
      </div>
    </div>
  );
}

function OneTimeIncomeSection({ events, onAdd, onUpdate, onRemove }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  function emptyDraft() {
    return { name: '', month: new Date().getMonth(), gross: '', taxWithheld: '' };
  }

  function patchDraft(patch) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function startAdd() {
    setEditingId('new');
    setDraft(emptyDraft());
  }

  function startEdit(ev) {
    setEditingId(ev.id);
    setDraft({
      name: ev.name,
      month: ev.month,
      gross: ev.gross || '',
      taxWithheld: ev.taxWithheld || '',
    });
  }

  function cancel() {
    setEditingId(null);
    setDraft(null);
  }

  function save() {
    const cleaned = {
      name: draft.name || 'Income event',
      month: Number(draft.month) || 0,
      gross: cleanNumber(draft.gross, 0),
      taxWithheld: cleanNumber(draft.taxWithheld, 0),
    };
    if (editingId === 'new') {
      onAdd({ ...cleaned, id: Math.random().toString(36).slice(2) });
    } else {
      onUpdate(editingId, cleaned);
    }
    setEditingId(null);
    setDraft(null);
  }

  const sorted = [...events].sort((a, b) => a.month - b.month);

  const totalGross = events.reduce((sum, e) => sum + (e.gross || 0), 0);
  const totalNet = events.reduce((sum, e) => sum + (e.gross || 0) - (e.taxWithheld || 0), 0);

  return (
    <div className="card spacious">
      <div className="income-head">
        <div>
          <SectionTitle>One-time &amp; bonus income</SectionTitle>
          <p className="helper-text no-bottom">Bonuses, RSU vests, or any lump-sum payment. Enter gross and tax rate — take-home is computed.</p>
        </div>
        {editingId === null && (
          <button className="btn" type="button" onClick={startAdd}>+ Add event</button>
        )}
      </div>

      {sorted.length === 0 && editingId === null ? (
        <div className="event-empty">
          No one-time income yet. Use the button above to add a bonus, RSU vest, or other payment.
        </div>
      ) : (
        <div className="event-list">
          {sorted.map((ev) => {
            const gross = ev.gross || 0;
            const tax = ev.taxWithheld || 0;
            const net = gross - tax;

            if (editingId === ev.id) {
              return (
                <div key={ev.id} className="event-edit-card">
                  <EventEditForm draft={draft} patchDraft={patchDraft} onSave={save} onCancel={cancel} />
                </div>
              );
            }

            return (
              <div key={ev.id} className="event-row">
                <span className="event-month-tag">{MONTHS[ev.month]}</span>
                <span className="event-name">{ev.name || 'Unnamed'}</span>
                <span className="event-amounts">
                  <span className="event-gross-amt">{fmtS(gross)}</span>
                  <span className="event-arrow">→</span>
                  <span className="event-net-amt">{fmtS(net)}</span>
                </span>
                <span className="event-actions">
                  <button className="icon-btn" type="button" onClick={() => startEdit(ev)} aria-label="Edit event">Edit</button>
                  <button className="del-btn" type="button" onClick={() => onRemove(ev.id)} aria-label="Remove event">×</button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {editingId === 'new' && (
        <div className="event-edit-card">
          <EventEditForm draft={draft} patchDraft={patchDraft} onSave={save} onCancel={cancel} />
        </div>
      )}

      {events.length > 1 && editingId === null && (
        <div className="event-summary">
          <span>{events.length} events &middot; <strong>{fmtS(totalGross)}</strong> gross &middot; <strong>{fmtS(totalNet)}</strong> take-home</span>
        </div>
      )}
    </div>
  );
}

function Income({ config, projection, plan, patchConfig, applyIncomeToPlan, onAddEvent, onUpdateEvent, onRemoveEvent }) {
  const dashboardMatches = MONTHS.every((_, i) => Math.round(plan.income[i] || 0) === Math.max(0, Math.round(projection.rows[i].postWithholding)));
  const totalPlanIncome = plan.income.reduce((sum, value) => sum + value, 0);
  const monthlyNet = projection.rows.map((row) => row.postWithholding);
  const monthlyGross = projection.rows.map((row) => row.totalGross);
  const hasVariablePaychecks = projection.paychecks.some((count) => count !== projection.paychecks[0]);

  function setNumber(field, value) {
    patchConfig({ [field]: cleanNumber(value, 0) });
  }

  return (
    <>
      <div className="card">
        <div className="income-head">
          <SectionTitle>Paycheck model</SectionTitle>
          <button className="btn primary-btn" type="button" onClick={applyIncomeToPlan}>
            {dashboardMatches ? 'Applied to plan' : 'Apply to dashboard plan'}
          </button>
        </div>
        <div className="income-form">
          <label>
            <span className="form-label">Pre-tax annual salary</span>
            <input type="number" min="0" step="1000" value={config.annualSalary || ''} placeholder="200000" onChange={(event) => setNumber('annualSalary', event.target.value)} />
          </label>
          <label>
            <span className="form-label">Paycheck frequency</span>
            <select value={config.frequency} onChange={(event) => patchConfig({ frequency: event.target.value })}>
              {paycheckFrequencies.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span className="form-label">First payday</span>
            <input type="date" value={config.firstPayDate} disabled={!['weekly', 'biweekly'].includes(config.frequency)} onChange={(event) => patchConfig({ firstPayDate: event.target.value })} />
          </label>
          <label>
            <span className="form-label">Taxes per paycheck</span>
            <input type="number" min="0" step="1" value={config.taxesPerPaycheck || ''} placeholder="0" onChange={(event) => setNumber('taxesPerPaycheck', event.target.value)} />
          </label>
          <label>
            <span className="form-label">Healthcare FSA / paycheck</span>
            <input type="number" min="0" step="1" value={config.fsaPerPaycheck || ''} placeholder="0" onChange={(event) => setNumber('fsaPerPaycheck', event.target.value)} />
          </label>
          <label>
            <span className="form-label">Insurance / paycheck</span>
            <input type="number" min="0" step="1" value={config.insurancePerPaycheck || ''} placeholder="0" onChange={(event) => setNumber('insurancePerPaycheck', event.target.value)} />
          </label>
          <label>
            <span className="form-label">Roth 401k / paycheck</span>
            <input type="number" min="0" step="1" value={config.preTax401kPerPaycheck || ''} placeholder="0" onChange={(event) => setNumber('preTax401kPerPaycheck', event.target.value)} />
          </label>
          <label>
            <span className="form-label">After-tax Roth / paycheck</span>
            <input type="number" min="0" step="1" value={config.afterTaxRothPerPaycheck || ''} placeholder="0" onChange={(event) => setNumber('afterTaxRothPerPaycheck', event.target.value)} />
          </label>
        </div>
      </div>

      <div className="metrics spacious-top">
        <Metric label="Gross income" value={fmtS(projection.annual.gross)} sub={`${fmtS(projection.grossPerPaycheck)} per check`} />
        <Metric label="Taxes" value={fmtS(projection.annual.taxes)} sub="salary + bonus" tone={projection.annual.taxes > 0 ? 'danger' : undefined} />
        <Metric label="Post-tax income" value={fmtS(projection.annual.postTax)} sub="before withholdings" />
        <Metric label="Post-withholding" value={fmtS(projection.annual.postWithholding)} sub={dashboardMatches ? 'synced to plan' : `plan has ${fmtS(totalPlanIncome)}`} tone={dashboardMatches ? 'good' : undefined} />
        <Metric label="Roth YTD" value={fmtS(projection.annual.rothYtd)} sub="salary + bonus" />
      </div>

      <div className="two-col">
        <div className="card">
          <SectionTitle>Gross vs take-home</SectionTitle>
          <Legend items={[{ label: 'Gross', color: colors.income }, { label: 'Post-withholding', color: colors.actual }]} />
          <LineChart
            labels={MONTHS}
            datasets={[
              { label: 'Gross', data: monthlyGross, color: colors.income, dash: true, pointRadius: 3 },
              { label: 'Post-withholding', data: monthlyNet, color: colors.actual, fill: true, pointRadius: 4 },
            ]}
            height={190}
          />
        </div>
        <div className="card">
          <SectionTitle>Monthly paycheck count</SectionTitle>
          <BarChart labels={MONTHS} values={projection.paychecks} colors={MONTHS.map(() => colors.bank)} height={190} axisFormatter={(value) => Math.round(value)} />
          <p className="helper-text no-bottom">{hasVariablePaychecks ? 'Payday timing creates higher-paycheck months.' : `${projection.frequency.label} pay stays even by month.`}</p>
        </div>
      </div>

      <OneTimeIncomeSection
        events={config.oneTimeEvents || []}
        onAdd={onAddEvent}
        onUpdate={onUpdateEvent}
        onRemove={onRemoveEvent}
      />

    </>
  );
}

function Spending({ state, plan, setSpAct }) {
  const entered = state.spAct.filter((value) => value !== null && value !== undefined).length;
  const actualYtd = state.spAct.reduce((sum, value) => sum + (value || 0), 0);
  const annualBudget = plan.budgetSp.reduce((sum, value) => sum + value, 0);
  const overCount = state.spAct.filter((value, i) => value !== null && value !== undefined && value > plan.budgetSp[i]).length;
  const annuals = Object.entries(plan.budgetCats).map(([name, values]) => ({ name, value: values.reduce((sum, item) => sum + item, 0) }));
  const maxAnnual = Math.max(1, ...annuals.map((item) => item.value));

  return (
    <>
      <div className="metrics">
        <Metric label="Annual budget" value={fmtS(annualBudget)} sub="full year" />
        <Metric label="Actuals entered" value={entered} sub="of 12 months" />
        <Metric label="YTD actual" value={entered > 0 ? fmtS(actualYtd) : '-'} sub={`${entered} months`} />
        <Metric label="Over budget" value={overCount} sub={overCount ? 'months over' : 'all on track'} tone={overCount ? 'danger' : 'good'} />
      </div>
      <div className="two-col">
        <div className="card">
          <SectionTitle>Budget by category annual</SectionTitle>
          <div className="bar-list">
            {annuals.map((item, i) => (
              <div className="bbar" key={item.name}>
                <span className="bbar-label">{item.name}</span>
                <div className="bbar-track"><div className="bbar-fill" style={{ width: `${Math.round((item.value / maxAnnual) * 100)}%`, background: catColors[i] }} /></div>
                <span className="bbar-val">{fmtS(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <SectionTitle>Budget vs actual trend</SectionTitle>
          <Legend items={[{ label: 'Budget', color: colors.spend, opacity: 0.65 }, { label: 'Actual', color: colors.actual }]} />
          <LineChart
            labels={MONTHS}
            datasets={[
              { label: 'Budget', data: plan.budgetSp, color: colors.spend, dash: true, pointRadius: 3 },
              { label: 'Actual', data: state.spAct, color: colors.actual, fill: true, pointRadius: 5 },
            ]}
            height={190}
          />
        </div>
      </div>
      <div className="card spacious">
        <SectionTitle>Monthly corrections</SectionTitle>
        <p className="helper-text">Enter your real total spending per month. Over-budget months are flagged red.</p>
        <div className="corr-grid header-row">
          <span>Month</span><span>Budget</span><span>Actual</span><span>Diff</span>
        </div>
        {MONTHS.map((month, i) => {
          const actual = state.spAct[i];
          const diff = actual !== null && actual !== undefined ? actual - plan.budgetSp[i] : null;
          return (
            <div className="corr-grid" key={month}>
              <strong>{month}</strong>
              <span className="muted">{fmt(plan.budgetSp[i])}</span>
              <input type="number" min="0" step="1" placeholder={fmt(plan.budgetSp[i])} value={actual ?? ''} onChange={(event) => setSpAct(i, event.target.value)} />
              <span>{diff !== null ? <span className={`badge ${diff > 0 ? 'badge-r' : 'badge-g'}`}>{fmtD(diff)}</span> : '-'}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Investments({ state, derived, plan, setInvAct }) {
  const actualSeries = MONTHS.map((_, i) => derived.getInv(i));
  const projectedSeries = MONTHS.map((_, i) => {
    if (i < derived.anchor.index) return null;
    if (i === derived.anchor.index) return derived.anchor.balance;
    return derived.getInv(i) !== null && derived.getInv(i) !== undefined ? null : derived.proj26[i];
  });

  return (
    <>
      <div className="metrics">
        <Metric label="Latest actual" value={fmtS(derived.anchor.balance)} sub={`${MONTHS[derived.anchor.index]} 2026`} />
        <Metric label="Year-end proj." value={fmtS(derived.proj26[11])} sub={`at ${state.projRate.toFixed(1)}%`} />
        <Metric label="YTD contributions" value={fmtS(plan.investing.reduce((sum, value) => sum + value, 0))} />
        <Metric label="Anchored months" value={plan.fixedInv.filter((value, i) => value !== null || state.userInv[i] !== undefined).length} />
      </div>
      <Legend items={[
        { label: 'Actual balance', color: colors.actual },
        { label: `Projected ${state.projRate.toFixed(1)}%`, color: colors.proj, opacity: 0.7 },
      ]} />
      <div className="chart-wrap tall">
        <LineChart
          labels={MONTHS}
          datasets={[
            { label: 'Actual', data: actualSeries, color: colors.actual, fill: true, pointRadius: 5 },
            { label: 'Projected', data: projectedSeries, color: colors.proj, dash: true, pointRadius: 3 },
          ]}
          height={270}
          includeZero={false}
        />
      </div>
      <div className="card spacious">
        <SectionTitle>Monthly contributions</SectionTitle>
        <BarChart labels={MONTHS} values={plan.investing} colors={MONTHS.map(() => colors.invest)} height={170} />
      </div>
      <div className="card spacious">
        <SectionTitle>2026 investment corrections</SectionTitle>
        <p className="helper-text">Enter real end-of-month balances to re-anchor the projection. The most recent actual becomes the new baseline.</p>
        <div className="inv-row header-row">
          <span>Month</span><span>Projected</span><span>Actual</span><span>Diff</span><span>Anchor</span>
        </div>
        {MONTHS.map((month, i) => {
          const isFixed = plan.fixedInv[i] !== null && state.userInv[i] === undefined;
          const actual = derived.getInv(i);
          const projected = derived.proj26[i];
          const diff = actual !== null && actual !== undefined && projected !== null ? actual - projected : null;
          return (
            <div className="inv-row" key={month}>
              <strong>{month}</strong>
              <span>{projected !== null ? fmt(projected) : '-'}</span>
              <input type="number" min="0" step="1" readOnly={isFixed} placeholder={actual !== null && actual !== undefined ? fmt(actual) : 'enter'} value={actual ?? ''} onChange={(event) => setInvAct(i, event.target.value)} />
              <span>{diff !== null ? <span className={`badge ${diff >= 0 ? 'badge-g' : 'badge-r'}`}>{diff >= 0 ? '+' : ''}{fmtS(diff)}</span> : '-'}</span>
              <span>{i === derived.anchor.index ? <span className="badge badge-p">anchor</span> : <span className="muted">-</span>}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function calcFederalTax(income) {
  const taxable = Math.max(0, income - STD_DEDUCTION_2026);
  let tax = 0;
  let prev = 0;
  for (const bracket of BRACKETS_2026_SINGLE) {
    const slice = Math.min(taxable, bracket.upTo) - prev;
    if (slice <= 0) break;
    tax += slice * bracket.rate;
    prev = bracket.upTo;
  }
  return Math.round(tax);
}

function buildRetirementProjection(accounts, config, getEffectiveAnnualContribution, birthYear) {
  const currentYear = 2026;
  const currentAge = birthYear ? currentYear - birthYear : null;
  if (!currentAge || currentAge < 0) return null;
  const yearsToRetirement = Math.max(0, config.retirementAge - currentAge);
  const rate = config.expectedReturn / 100;

  const accountProjections = accounts.map((acc) => {
    const annual = getEffectiveAnnualContribution(acc);
    const balances = [acc.currentBalance];
    for (let y = 1; y <= yearsToRetirement; y++) {
      balances.push(Math.round(balances[y - 1] * (1 + rate) + annual));
    }
    return { ...acc, balances };
  });

  const years = Array.from({ length: yearsToRetirement + 1 }, (_, i) => currentYear + i);
  const totalBalances = years.map((_, i) => accountProjections.reduce((s, a) => s + (a.balances[i] || 0), 0));
  const rothBalances = years.map((_, i) =>
    accountProjections.filter((a) => a.type === 'roth_401k' || a.type === 'roth_ira').reduce((s, a) => s + (a.balances[i] || 0), 0)
  );
  const tradBalances = years.map((_, i) =>
    accountProjections.filter((a) => a.type !== 'roth_401k' && a.type !== 'roth_ira').reduce((s, a) => s + (a.balances[i] || 0), 0)
  );

  return { years, accountProjections, totalBalances, rothBalances, tradBalances, yearsToRetirement };
}

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = value > max;
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: over ? colors.danger : (color || colors.proj) }} />
    </div>
  );
}

function Retirement({ state, incomeProjection, patchState, addAccount, updateAccount, removeAccount, patchConfig }) {
  const [activeSub, setActiveSub] = useState('accounts');

  const currentYear = 2026;
  const currentAge = state.birthYear ? currentYear - state.birthYear : null;
  const catchupEligible = currentAge !== null && currentAge >= 50;
  const irsLimit401k = IRS_LIMITS_2026.k401 + (catchupEligible ? IRS_LIMITS_2026.k401Catchup : 0);
  const irsLimitIra = IRS_LIMITS_2026.ira + (catchupEligible ? IRS_LIMITS_2026.iraCatchup : 0);

  const annual401kFromIncome = (incomeProjection?.rows || []).reduce((s, r) => s + (r.salary401k || 0), 0);
  const annualRoth401kFromIncome = (incomeProjection?.rows || []).reduce((s, r) => s + (r.afterTaxRoth || 0), 0);
  const annualGross = incomeProjection?.annual?.gross || 0;

  function getEffectiveAnnualContribution(acc) {
    if (acc.linkedToIncome) {
      if (acc.type === 'traditional_401k') return annual401kFromIncome;
      if (acc.type === 'roth_401k') return annualRoth401kFromIncome;
    }
    return acc.manualAnnualContribution || 0;
  }

  const totalBalance = state.retirementAccounts.reduce((s, a) => s + a.currentBalance, 0);
  const total401kYtd = state.retirementAccounts.filter((a) => a.type === 'traditional_401k' || a.type === 'roth_401k').reduce((s, a) => s + a.ytdContributions, 0);
  const totalIraYtd = state.retirementAccounts.filter((a) => a.type === 'traditional_ira' || a.type === 'roth_ira').reduce((s, a) => s + a.ytdContributions, 0);
  const yearsToRetirement = currentAge !== null ? Math.max(0, state.retirementConfig.retirementAge - currentAge) : null;

  const showRothIncomeWarning = state.retirementAccounts.some((a) => a.type === 'roth_ira') && annualGross > 150000;

  return (
    <>
      <nav className="sub-tabs">
        {retirementSubTabs.map((tab) => (
          <button key={tab.key} className={`sub-tab ${activeSub === tab.key ? 'active' : ''}`} onClick={() => setActiveSub(tab.key)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeSub === 'accounts' && (
        <RetirementAccounts
          state={state}
          patchState={patchState}
          catchupEligible={catchupEligible}
          irsLimit401k={irsLimit401k}
          irsLimitIra={irsLimitIra}
          total401kYtd={total401kYtd}
          totalIraYtd={totalIraYtd}
          totalBalance={totalBalance}
          getEffectiveAnnualContribution={getEffectiveAnnualContribution}
          annual401kFromIncome={annual401kFromIncome}
          annualRoth401kFromIncome={annualRoth401kFromIncome}
          showRothIncomeWarning={showRothIncomeWarning}
          annualGross={annualGross}
          addAccount={addAccount}
          updateAccount={updateAccount}
          removeAccount={removeAccount}
        />
      )}
      {activeSub === 'projections' && (
        <RetirementProjections
          state={state}
          yearsToRetirement={yearsToRetirement}
          totalBalance={totalBalance}
          getEffectiveAnnualContribution={getEffectiveAnnualContribution}
          patchConfig={patchConfig}
        />
      )}
      {activeSub === 'withdrawals' && (
        <RetirementWithdrawals
          state={state}
          getEffectiveAnnualContribution={getEffectiveAnnualContribution}
          totalBalance={totalBalance}
          yearsToRetirement={yearsToRetirement}
          patchConfig={patchConfig}
        />
      )}
    </>
  );
}

function RetirementAccounts({
  state, patchState, catchupEligible, irsLimit401k, irsLimitIra,
  total401kYtd, totalIraYtd, totalBalance, getEffectiveAnnualContribution,
  annual401kFromIncome, annualRoth401kFromIncome,
  showRothIncomeWarning, annualGross,
  addAccount, updateAccount, removeAccount,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);

  function openAdd() {
    setForm({ name: '', type: 'traditional_401k', currentBalance: '', ytdContributions: '', linkedToIncome: false, manualAnnualContribution: '' });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(acc) {
    setForm({ ...acc });
    setEditingId(acc.id);
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setForm(null); setEditingId(null); }

  function saveForm() {
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      id: editingId || Math.random().toString(36).slice(2),
      currentBalance: Number(form.currentBalance) || 0,
      ytdContributions: Number(form.ytdContributions) || 0,
      manualAnnualContribution: Number(form.manualAnnualContribution) || 0,
    };
    if (editingId) updateAccount(editingId, payload);
    else addAccount(payload);
    closeForm();
  }

  function patchForm(patch) { setForm((f) => ({ ...f, ...patch })); }

  const accounts = state.retirementAccounts;
  const totalAnnual = accounts.reduce((s, a) => s + getEffectiveAnnualContribution(a), 0);

  return (
    <>
      <div className="metrics">
        <Metric label="Total balance" value={fmtS(totalBalance)} />
        <Metric label="Annual contributions" value={fmtS(totalAnnual)} sub="projected" />
        <Metric label="401(k) room left" value={fmtS(Math.max(0, irsLimit401k - total401kYtd))} sub={`of ${fmtS(irsLimit401k)} limit`} tone={total401kYtd >= irsLimit401k ? 'danger' : undefined} />
        <Metric label="IRA room left" value={fmtS(Math.max(0, irsLimitIra - totalIraYtd))} sub={`of ${fmtS(irsLimitIra)} limit`} tone={totalIraYtd >= irsLimitIra ? 'danger' : undefined} />
      </div>

      <div className="card spacious">
        <div className="income-head">
          <SectionTitle>Birth year</SectionTitle>
        </div>
        <div className="ret-birth-row">
          <label className="form-label" style={{ marginBottom: 0 }}>Birth year{catchupEligible ? <span className="badge badge-g" style={{ marginLeft: 8 }}>Catch-up eligible</span> : null}</label>
          <input
            type="number"
            min="1940"
            max="2000"
            value={state.birthYear || ''}
            placeholder="e.g. 1990"
            onChange={(e) => patchState({ birthYear: Number(e.target.value) || 1990 })}
            style={{ maxWidth: 120 }}
          />
        </div>
      </div>

      {showRothIncomeWarning && (
        <div className="card spacious ret-warning">
          <strong>Roth IRA income note</strong>
          <span>Your projected gross income ({fmtS(annualGross)}) may exceed the {fmtS(150000)} single-filer phase-out threshold for Roth IRA contributions. Consider a backdoor Roth strategy.</span>
        </div>
      )}

      <div className="card spacious">
        <div className="income-head">
          <SectionTitle>Accounts</SectionTitle>
          {!showForm && <button className="btn" onClick={openAdd}>+ Add account</button>}
        </div>

        {showForm && form && (
          <div className="ret-account-form">
            <div className="ret-form-grid">
              <label>
                <span className="form-label">Account name</span>
                <input type="text" value={form.name} placeholder="e.g. Fidelity 401k" onChange={(e) => patchForm({ name: e.target.value })} />
              </label>
              <label>
                <span className="form-label">Account type</span>
                <select value={form.type} onChange={(e) => patchForm({ type: e.target.value, linkedToIncome: false })}>
                  {ACCOUNT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </label>
              <label>
                <span className="form-label">Current balance</span>
                <input type="number" min="0" step="1" value={form.currentBalance} placeholder="0" onChange={(e) => patchForm({ currentBalance: e.target.value })} />
              </label>
              <label>
                <span className="form-label">YTD contributions (2026)</span>
                <input type="number" min="0" step="1" value={form.ytdContributions} placeholder="0" onChange={(e) => patchForm({ ytdContributions: e.target.value })} />
              </label>
              {ACCOUNT_TYPES.find((t) => t.key === form.type)?.canLink ? (
                <label className="ret-link-label">
                  <span className="form-label">Annual contributions</span>
                  <div className="ret-link-row">
                    <label className="ret-checkbox-label">
                      <input type="checkbox" checked={form.linkedToIncome} onChange={(e) => patchForm({ linkedToIncome: e.target.checked })} />
                      <span>Link to income tab</span>
                    </label>
                    {form.linkedToIncome ? (
                      <span className="ret-linked-note">
                        {form.type === 'traditional_401k' ? `${fmtS(annual401kFromIncome)}/yr from income tab` : `${fmtS(annualRoth401kFromIncome)}/yr from income tab`}
                      </span>
                    ) : (
                      <input type="number" min="0" step="1" value={form.manualAnnualContribution} placeholder="Annual contribution" onChange={(e) => patchForm({ manualAnnualContribution: e.target.value })} />
                    )}
                  </div>
                </label>
              ) : (
                <label>
                  <span className="form-label">Annual contribution</span>
                  <input type="number" min="0" step="1" value={form.manualAnnualContribution} placeholder="0" onChange={(e) => patchForm({ manualAnnualContribution: e.target.value })} />
                </label>
              )}
            </div>
            <div className="ret-form-actions">
              <button className="btn" onClick={closeForm}>Cancel</button>
              <button className="btn primary-btn" onClick={saveForm} disabled={!form.name.trim()}>Save</button>
            </div>
          </div>
        )}

        {accounts.length === 0 && !showForm && (
          <p className="helper-text" style={{ paddingTop: 4 }}>No retirement accounts yet. Add one to start tracking contributions and projecting growth.</p>
        )}

        {accounts.map((acc) => {
          const typeInfo = ACCOUNT_TYPES.find((t) => t.key === acc.type);
          const limit = acc.type === 'traditional_401k' || acc.type === 'roth_401k' ? irsLimit401k : irsLimitIra;
          const annual = getEffectiveAnnualContribution(acc);
          const remaining = Math.max(0, limit - acc.ytdContributions);
          return (
            <div key={acc.id} className="ret-account-card spacious">
              <div className="ret-account-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="ret-account-name">{acc.name}</span>
                  <span className={`badge ${typeInfo?.isRoth ? 'badge-p' : 'badge-trad'}`}>{typeInfo?.shortLabel}</span>
                  {acc.linkedToIncome && <span className="badge badge-g">linked</span>}
                </div>
                <div className="event-actions">
                  <button className="icon-btn" onClick={() => openEdit(acc)}>Edit</button>
                  <button className="icon-btn" onClick={() => removeAccount(acc.id)}>Remove</button>
                </div>
              </div>
              <div className="ret-account-stats">
                <div className="ret-stat">
                  <span className="ret-stat-label">Balance</span>
                  <span className="ret-stat-value">{fmtS(acc.currentBalance)}</span>
                </div>
                <div className="ret-stat">
                  <span className="ret-stat-label">Annual (projected)</span>
                  <span className="ret-stat-value">{fmtS(annual)}</span>
                </div>
                <div className="ret-stat">
                  <span className="ret-stat-label">YTD contributed</span>
                  <span className="ret-stat-value">{fmtS(acc.ytdContributions)}</span>
                </div>
                <div className="ret-stat">
                  <span className="ret-stat-label">IRS limit room</span>
                  <span className={`ret-stat-value ${acc.ytdContributions >= limit ? 'tone-danger' : ''}`}>{fmtS(remaining)}</span>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div className="ret-limit-row">
                  <span className="ret-stat-label">{fmtS(acc.ytdContributions)} contributed of {fmtS(limit)} limit</span>
                  <span className="ret-stat-label">{limit > 0 ? Math.round((acc.ytdContributions / limit) * 100) : 0}%</span>
                </div>
                <ProgressBar value={acc.ytdContributions} max={limit} color={typeInfo?.isRoth ? colors.proj : colors.income} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="two-col">
        <div className="card">
          <SectionTitle>401(k) limit status</SectionTitle>
          <div className="ret-limit-row" style={{ marginBottom: 6 }}>
            <span className="ret-stat-label">Combined YTD</span>
            <strong>{fmtS(total401kYtd)} / {fmtS(irsLimit401k)}</strong>
          </div>
          <ProgressBar value={total401kYtd} max={irsLimit401k} />
          {catchupEligible && <p className="helper-text" style={{ marginTop: 8, marginBottom: 0 }}>Catch-up contributions included (+{fmtS(IRS_LIMITS_2026.k401Catchup)}).</p>}
        </div>
        <div className="card">
          <SectionTitle>IRA limit status</SectionTitle>
          <div className="ret-limit-row" style={{ marginBottom: 6 }}>
            <span className="ret-stat-label">Combined YTD</span>
            <strong>{fmtS(totalIraYtd)} / {fmtS(irsLimitIra)}</strong>
          </div>
          <ProgressBar value={totalIraYtd} max={irsLimitIra} />
          {catchupEligible && <p className="helper-text" style={{ marginTop: 8, marginBottom: 0 }}>Catch-up contributions included (+{fmtS(IRS_LIMITS_2026.iraCatchup)}).</p>}
        </div>
      </div>
    </>
  );
}

function RetirementProjections({ state, yearsToRetirement, totalBalance, getEffectiveAnnualContribution, patchConfig }) {
  const projection = useMemo(
    () => buildRetirementProjection(state.retirementAccounts, state.retirementConfig, getEffectiveAnnualContribution, state.birthYear),
    [state.retirementAccounts, state.retirementConfig, state.birthYear, getEffectiveAnnualContribution]
  );

  const projectedAtRetirement = projection?.totalBalances[projection.totalBalances.length - 1] || 0;
  const projectedRoth = projection?.rothBalances[projection.rothBalances.length - 1] || 0;
  const projectedTrad = projection?.tradBalances[projection.tradBalances.length - 1] || 0;
  const inflationFactor = projection
    ? Math.pow(1 + state.retirementConfig.inflationRate / 100, projection.yearsToRetirement)
    : 1;
  const realValue = projectedAtRetirement / inflationFactor;
  const safe4Pct = projectedAtRetirement * 0.04;

  const labeledYears = (projection?.years || []).map(String);
  const totalDataset = { label: 'Total', data: projection?.totalBalances || [], color: colors.proj, fill: true };
  const rothDataset = { label: 'Roth', data: projection?.rothBalances || [], color: colors.actual, dash: true };
  const tradDataset = { label: 'Traditional', data: projection?.tradBalances || [], color: colors.income, dash: true };

  const hasAccounts = state.retirementAccounts.length > 0;
  const currentAge = state.birthYear ? 2026 - state.birthYear : null;

  return (
    <>
      <div className="card">
        <SectionTitle>Projection assumptions</SectionTitle>
        <div className="proj-controls">
          <Slider label="Retirement age" value={state.retirementConfig.retirementAge} min={50} max={80} step={1} display={`Age ${state.retirementConfig.retirementAge}`} onChange={(v) => patchConfig({ retirementAge: v })} />
          <Slider label="Annual return" value={state.retirementConfig.expectedReturn} min={1} max={15} step={0.5} display={`${state.retirementConfig.expectedReturn.toFixed(1)}%`} onChange={(v) => patchConfig({ expectedReturn: v })} />
          <Slider label="Inflation rate" value={state.retirementConfig.inflationRate} min={0} max={8} step={0.5} display={`${state.retirementConfig.inflationRate.toFixed(1)}%`} onChange={(v) => patchConfig({ inflationRate: v })} />
        </div>
      </div>

      <div className="metrics spacious-top">
        <Metric label="Projected at retirement" value={fmtS(projectedAtRetirement)} sub={currentAge ? `age ${state.retirementConfig.retirementAge}` : undefined} />
        <Metric label="Inflation-adjusted" value={fmtS(realValue)} sub={`in today's dollars`} />
        <Metric label="4% safe withdrawal" value={fmtS(safe4Pct)} sub="per year" />
        <Metric label="Years to retirement" value={yearsToRetirement !== null ? yearsToRetirement : '—'} sub={currentAge ? `currently age ${currentAge}` : 'set birth year'} />
      </div>

      {!hasAccounts && (
        <p className="helper-text spacious-top">Add retirement accounts in the Accounts tab to see projections.</p>
      )}

      {hasAccounts && projection && (
        <>
          <Legend items={[
            { label: 'Total balance', color: colors.proj },
            { label: 'Roth portion', color: colors.actual, opacity: 0.7 },
            { label: 'Traditional portion', color: colors.income, opacity: 0.7 },
          ]} />
          <div className="chart-wrap tall">
            <LineChart
              labels={labeledYears}
              datasets={[totalDataset, rothDataset, tradDataset]}
              height={270}
              includeZero={false}
            />
          </div>

          <div className="two-col">
            <div className="card">
              <SectionTitle>At retirement breakdown</SectionTitle>
              {state.retirementAccounts.map((acc) => {
                const ap = projection.accountProjections.find((p) => p.id === acc.id);
                const bal = ap?.balances[ap.balances.length - 1] || 0;
                const typeInfo = ACCOUNT_TYPES.find((t) => t.key === acc.type);
                return (
                  <div key={acc.id} className="bal-row" style={{ fontSize: 13 }}>
                    <div className="bal-name">
                      <span className="bdot" style={{ background: typeInfo?.isRoth ? colors.proj : colors.income }} />
                      <span>{acc.name}</span>
                      <span className={`badge ${typeInfo?.isRoth ? 'badge-p' : 'badge-trad'}`}>{typeInfo?.shortLabel}</span>
                    </div>
                    <span className="bal-pts">{fmtS(bal)}</span>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <SectionTitle>Tax diversification</SectionTitle>
              <div className="ret-tax-split">
                <div>
                  <div className="ret-limit-row" style={{ marginBottom: 4 }}>
                    <span className="ret-stat-label">Roth (tax-free)</span>
                    <strong>{projectedAtRetirement > 0 ? Math.round((projectedRoth / projectedAtRetirement) * 100) : 0}%</strong>
                  </div>
                  <ProgressBar value={projectedRoth} max={projectedAtRetirement} color={colors.proj} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <div className="ret-limit-row" style={{ marginBottom: 4 }}>
                    <span className="ret-stat-label">Traditional (taxable)</span>
                    <strong>{projectedAtRetirement > 0 ? Math.round((projectedTrad / projectedAtRetirement) * 100) : 0}%</strong>
                  </div>
                  <ProgressBar value={projectedTrad} max={projectedAtRetirement} color={colors.income} />
                </div>
                <p className="helper-text" style={{ marginTop: 12, marginBottom: 0 }}>A healthy mix of both gives flexibility to manage taxes in retirement.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function RetirementWithdrawals({ state, getEffectiveAnnualContribution, totalBalance, yearsToRetirement, patchConfig }) {
  const [annualSpending, setAnnualSpending] = useState(80000);
  const [otherIncome, setOtherIncome] = useState(0);

  const projection = useMemo(
    () => buildRetirementProjection(state.retirementAccounts, state.retirementConfig, getEffectiveAnnualContribution, state.birthYear),
    [state.retirementAccounts, state.retirementConfig, state.birthYear, getEffectiveAnnualContribution]
  );

  const projectedBalance = projection?.totalBalances[projection.totalBalances.length - 1] || totalBalance;
  const projectedTrad = projection?.tradBalances[projection.tradBalances.length - 1] || 0;
  const projectedRoth = projection?.rothBalances[projection.rothBalances.length - 1] || 0;

  const withdrawalNeeded = Math.max(0, annualSpending - otherIncome);
  const tradShare = projectedBalance > 0 ? projectedTrad / projectedBalance : 0;
  const tradWithdrawal = Math.round(withdrawalNeeded * tradShare);
  const rothWithdrawal = withdrawalNeeded - tradWithdrawal;
  const taxOnTrad = calcFederalTax(tradWithdrawal + otherIncome) - calcFederalTax(otherIncome);
  const taxTotal = Math.max(0, taxOnTrad);
  const totalNeeded = withdrawalNeeded + taxTotal;
  const effectiveTaxRate = totalNeeded > 0 ? (taxTotal / totalNeeded) * 100 : 0;
  const returnRate = state.retirementConfig.expectedReturn / 100;

  const portfolioYears = useMemo(() => {
    if (projectedBalance <= 0 || totalNeeded <= 0) return null;
    let balance = projectedBalance;
    for (let y = 1; y <= 60; y++) {
      balance = balance * (1 + returnRate) - totalNeeded;
      if (balance <= 0) return y;
    }
    return '60+';
  }, [projectedBalance, totalNeeded, returnRate]);

  const rmdAge = 73;
  const retirementAge = state.retirementConfig.retirementAge;
  const currentAge = state.birthYear ? 2026 - state.birthYear : null;
  const yearsUntilRmd = currentAge ? rmdAge - currentAge : null;

  const hasAccounts = state.retirementAccounts.length > 0;

  return (
    <>
      <div className="card">
        <SectionTitle>Withdrawal scenario</SectionTitle>
        <p className="helper-text">Model your retirement income needs. Taxes are estimated using 2026 federal brackets for a single filer.</p>
        <div className="proj-controls">
          <Slider label="Annual spending" value={annualSpending} min={20000} max={300000} step={5000} display={fmtS(annualSpending)} onChange={setAnnualSpending} />
          <Slider label="Other income (SS, etc.)" value={otherIncome} min={0} max={100000} step={1000} display={fmtS(otherIncome)} onChange={setOtherIncome} />
          <Slider label="Retirement age" value={retirementAge} min={50} max={80} step={1} display={`Age ${retirementAge}`} onChange={(v) => patchConfig({ retirementAge: v })} />
        </div>
      </div>

      <div className="metrics spacious-top">
        <Metric label="Projected balance" value={fmtS(projectedBalance)} sub={currentAge ? `at age ${retirementAge}` : undefined} />
        <Metric label="Withdrawal needed" value={fmtS(withdrawalNeeded)} sub="spending − other income" />
        <Metric label="Est. federal tax" value={fmtS(taxTotal)} sub={`${effectiveTaxRate.toFixed(1)}% effective rate`} tone={taxTotal > 0 ? 'danger' : undefined} />
        <Metric label="Portfolio lasts" value={portfolioYears !== null ? (typeof portfolioYears === 'string' ? portfolioYears : `${portfolioYears} yrs`) : '—'} sub="at this withdrawal rate" tone={typeof portfolioYears === 'number' && portfolioYears < 25 ? 'danger' : 'good'} />
      </div>

      {hasAccounts && (
        <div className="card spacious">
          <SectionTitle>Withdrawal breakdown</SectionTitle>
          <div className="ret-withdraw-row header-row" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
            <span>Source</span><span>Amount</span><span>Tax</span><span>Net</span>
          </div>
          <div className="ret-withdraw-row" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="bdot" style={{ background: colors.proj }} />
              <span>Roth accounts</span>
              <span className="badge badge-p">tax-free</span>
            </div>
            <span>{fmtS(rothWithdrawal)}</span>
            <span className="muted">$0</span>
            <span style={{ color: colors.cf, fontWeight: 600 }}>{fmtS(rothWithdrawal)}</span>
          </div>
          <div className="ret-withdraw-row" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="bdot" style={{ background: colors.income }} />
              <span>Traditional accounts</span>
              <span className="badge badge-trad">ordinary income</span>
            </div>
            <span>{fmtS(tradWithdrawal)}</span>
            <span style={{ color: colors.danger }}>{fmtS(taxTotal)}</span>
            <span style={{ color: colors.cf, fontWeight: 600 }}>{fmtS(Math.max(0, tradWithdrawal - taxTotal))}</span>
          </div>
          {otherIncome > 0 && (
            <div className="ret-withdraw-row" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="bdot" style={{ background: colors.actual }} />
                <span>Other income</span>
              </div>
              <span>{fmtS(otherIncome)}</span>
              <span className="muted">—</span>
              <span style={{ color: colors.cf, fontWeight: 600 }}>{fmtS(otherIncome)}</span>
            </div>
          )}
          <div className="ret-withdraw-row" style={{ gridTemplateColumns: '1fr auto auto auto', borderBottom: 0 }}>
            <strong>Total</strong>
            <strong>{fmtS(withdrawalNeeded + otherIncome)}</strong>
            <strong style={{ color: colors.danger }}>{fmtS(taxTotal)}</strong>
            <strong style={{ color: colors.cf }}>{fmtS(annualSpending - taxTotal)}</strong>
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <SectionTitle>Early withdrawal note</SectionTitle>
          <p className="helper-text" style={{ marginBottom: 0 }}>
            Withdrawals from Traditional accounts before age 59½ are subject to a <strong>10% penalty</strong> plus ordinary income tax. Roth contributions (not earnings) can be withdrawn penalty-free at any age.
          </p>
        </div>
        <div className="card">
          <SectionTitle>Required minimum distributions</SectionTitle>
          <p className="helper-text" style={{ marginBottom: 0 }}>
            RMDs begin at age <strong>73</strong> for Traditional 401(k) and IRA accounts.
            {yearsUntilRmd !== null && yearsUntilRmd > 0 && ` That's ${yearsUntilRmd} years from now.`}
            {yearsUntilRmd !== null && yearsUntilRmd <= 0 && ' RMDs may already apply to your accounts.'}
            {' '}Roth IRAs have no RMDs during your lifetime.
          </p>
        </div>
      </div>

      {!hasAccounts && (
        <p className="helper-text spacious-top">Add retirement accounts in the Accounts tab to model withdrawals.</p>
      )}
    </>
  );
}

function Projection({ state, derived, plan, patchState, setInvAct }) {
  const longProjection = useMemo(() => {
    const labels = [2026];
    const values = [derived.proj26[11]];
    let balance = derived.proj26[11];
    const annualRate = state.projRate / 100;
    for (let year = 1; year <= state.projYears; year += 1) {
      balance = balance * (1 + annualRate) + state.projMonthly * 12;
      labels.push(2026 + year);
      values.push(Math.round(balance));
    }
    const end = values[values.length - 1];
    const growth = end - derived.proj26[11] - state.projMonthly * 12 * state.projYears;
    return { labels, values, end, growth };
  }, [derived.proj26, state.projMonthly, state.projRate, state.projYears]);

  return (
    <>
      <div className="card">
        <SectionTitle>Projection assumptions</SectionTitle>
        <div className="proj-controls">
          <Slider label="Annual return" value={state.projRate} min={2} max={20} step={0.5} display={`${state.projRate.toFixed(1)}%`} onChange={(value) => patchState({ projRate: value })} />
          <Slider label="Years to project" value={state.projYears} min={1} max={30} step={1} display={`${state.projYears} yrs`} onChange={(value) => patchState({ projYears: value })} />
          <Slider label="Monthly add" value={state.projMonthly} min={0} max={15000} step={500} display={fmt(state.projMonthly)} onChange={(value) => patchState({ projMonthly: value })} />
        </div>
      </div>
      <div className="metrics spacious-top">
        <Metric label="Projected balance" value={fmtS(longProjection.end)} sub={`in ${state.projYears} years`} />
        <Metric label="2026 year-end est." value={fmtS(derived.proj26[11])} />
        <Metric label="Investment growth" value={fmtS(longProjection.growth)} sub="from compounding" tone={longProjection.growth >= 0 ? 'good' : 'danger'} />
        <Metric label="Anchor" value={MONTHS[derived.anchor.index]} sub={fmt(derived.anchor.balance)} />
      </div>
      <Legend items={[
        { label: 'Long-term projection', color: colors.proj },
        { label: `Anchor: ${MONTHS[derived.anchor.index]} = ${fmt(derived.anchor.balance)}`, color: colors.actual },
      ]} />
      <div className="chart-wrap tall">
        <LineChart labels={longProjection.labels.map(String)} datasets={[{ label: 'Projection', data: longProjection.values, color: colors.proj, fill: true }]} height={290} includeZero={false} />
      </div>
    </>
  );
}

function Slider({ label, value, min, max, step, display, onChange }) {
  return (
    <label className="ctrl-row">
      <span className="ctrl-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="ctrl-val">{display}</span>
    </label>
  );
}

function Points(props) {
  const {
    activeSub, setActiveSub, activePtCat, setActivePtCat, selectedProviders, state, txnDraft,
    setTxnDraft, getBal, getStartBal, toggleProvider, setPtBal, addTxn, deleteTxn,
  } = props;

  return (
    <>
      <div className="sub-tabs">
        {subTabs.map((tab) => (
          <button key={tab.key} className={`sub-tab ${activeSub === tab.key ? 'active' : ''}`} onClick={() => setActiveSub(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>
      {activeSub === 'balances' ? (
        <PointBalances activePtCat={activePtCat} setActivePtCat={setActivePtCat} selectedProviders={selectedProviders} state={state} getBal={getBal} getStartBal={getStartBal} toggleProvider={toggleProvider} setPtBal={setPtBal} />
      ) : null}
      {activeSub === 'timeline' ? <PointTimeline selectedProviders={selectedProviders} state={state} getBal={getBal} getStartBal={getStartBal} /> : null}
      {activeSub === 'transactions' ? (
        <PointTransactions selectedProviders={selectedProviders} state={state} txnDraft={txnDraft} setTxnDraft={setTxnDraft} addTxn={addTxn} deleteTxn={deleteTxn} />
      ) : null}
    </>
  );
}

function PointBalances({ activePtCat, setActivePtCat, selectedProviders, state, getBal, getStartBal, toggleProvider, setPtBal }) {
  const total = selectedProviders.reduce((sum, provider) => sum + getBal(provider.id), 0);
  const categoryStats = Object.entries(providers).map(([key, group]) => ({
    key,
    label: group.label,
    count: group.items.filter((provider) => state.ptSelected[provider.id]).length,
    total: group.items.filter((provider) => state.ptSelected[provider.id]).reduce((sum, provider) => sum + getBal(provider.id), 0),
  }));

  return (
    <>
      <div className="metrics">
        <Metric label="Total points" value={fmtP(total)} sub={`${selectedProviders.length} programs`} />
        {categoryStats.map((cat) => <Metric key={cat.key} label={cat.label} value={fmtP(cat.total)} sub={`${cat.count} active`} />)}
      </div>
      <div className="cat-tabs">
        {Object.entries(providers).map(([key, group]) => (
          <button key={key} className={`cat-tab ${activePtCat === key ? 'active' : ''}`} onClick={() => setActivePtCat(key)}>
            {group.label}
          </button>
        ))}
      </div>
      <div className="provider-grid">
        {providers[activePtCat].items.map((provider) => {
          const isSelected = !!state.ptSelected[provider.id];
          return (
            <div key={provider.id} className={`pcard ${isSelected ? 'sel' : ''}`} onClick={() => toggleProvider(provider.id)} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && toggleProvider(provider.id)}>
              {isSelected ? <div className="check-icon">✓</div> : null}
              <div className="pcard-name">{provider.name}</div>
              {isSelected ? (
                <>
                  <div className="pcard-pts">{fmtP(getBal(provider.id))}</div>
                  <div className="pcard-sub">pts</div>
                  <label className="inline-field" onClick={(event) => event.stopPropagation()}>
                    <span>Starting balance</span>
                    <input type="number" min="0" value={getStartBal(provider.id) || ''} placeholder="0" onChange={(event) => setPtBal(provider.id, event.target.value)} />
                  </label>
                </>
              ) : <div className="pcard-hint">Click to add</div>}
            </div>
          );
        })}
      </div>
      <div className="card">
        <SectionTitle>All balances</SectionTitle>
        {selectedProviders.length ? selectedProviders.map((provider) => {
          const balance = getBal(provider.id);
          const delta = balance - getStartBal(provider.id);
          return (
            <div className="bal-row" key={provider.id}>
              <div className="bal-name"><span className="bdot" style={{ background: provider.color }} />{provider.name}</div>
              <span className="bal-pts">{fmtP(balance)} pts</span>
              <span>{delta ? <span className={`badge ${delta > 0 ? 'badge-g' : 'badge-r'}`}>{delta > 0 ? '+' : ''}{fmtP(delta)}</span> : null}</span>
            </div>
          );
        }) : <div className="empty">Select providers above to track your points.</div>}
      </div>
    </>
  );
}

function PointTimeline({ selectedProviders, state, getBal, getStartBal }) {
  const timeline = useMemo(() => {
    const now = new Date();
    const labels = [];
    const dates = [];
    for (let m = -6; m <= 6; m += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
      labels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
      dates.push(new Date(now.getFullYear(), now.getMonth() + m + 1, 0));
    }
    const datasets = selectedProviders.map((provider) => {
      const txns = state.ptTxns.filter((txn) => txn.provider === provider.id).sort((a, b) => new Date(a.date) - new Date(b.date));
      const data = dates.map((date) => getStartBal(provider.id) + txns.filter((txn) => new Date(txn.date) <= date).reduce((sum, txn) => sum + txn.pts, 0));
      return { label: provider.name, data, color: provider.color, pointRadius: 3 };
    });
    return { labels, datasets };
  }, [getStartBal, selectedProviders, state.ptTxns]);

  const categoryData = ['cc', 'hotel', 'airline'].map((key) => providers[key].items.filter((provider) => state.ptSelected[provider.id]).reduce((sum, provider) => sum + getBal(provider.id), 0));
  const total = selectedProviders.reduce((sum, provider) => sum + getBal(provider.id), 0);
  const sorted = [...selectedProviders].sort((a, b) => getBal(b.id) - getBal(a.id));

  if (!selectedProviders.length) {
    return <div className="empty large-empty">Select providers in Balances first.</div>;
  }

  return (
    <>
      <div className="metrics">
        <Metric label="Total points" value={fmtP(total)} sub="across all programs" />
        <Metric label="Programs tracked" value={selectedProviders.length} />
        <Metric label="Transactions" value={state.ptTxns.length} />
      </div>
      <div className="card">
        <SectionTitle>Points balance over time</SectionTitle>
        <Legend items={selectedProviders.map((provider) => ({ label: provider.name, color: provider.color }))} />
        <LineChart labels={timeline.labels} datasets={timeline.datasets} axisFormatter={fmtP} height={280} includeZero={false} />
      </div>
      <div className="two-col">
        <div className="card">
          <SectionTitle>By category</SectionTitle>
          <DonutChart data={categoryData} labels={['Credit Cards', 'Hotels', 'Airlines']} palette={[colors.income, '#8B0000', '#005DAA']} />
        </div>
        <div className="card">
          <SectionTitle>Top providers</SectionTitle>
          {sorted.map((provider) => (
            <div className="bal-row" key={provider.id}>
              <div className="bal-name"><span className="bdot" style={{ background: provider.color }} />{provider.name}</div>
              <span className="bal-pts">{fmtP(getBal(provider.id))}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PointTransactions({ selectedProviders, state, txnDraft, setTxnDraft, addTxn, deleteTxn }) {
  const provider = txnDraft.provider || selectedProviders[0]?.id || '';
  return (
    <>
      <div className="card">
        <SectionTitle>Log a transaction</SectionTitle>
        <form className="txn-form" onSubmit={addTxn}>
          <label>
            <span className="form-label">Provider</span>
            <select value={provider} onChange={(event) => setTxnDraft((draft) => ({ ...draft, provider: event.target.value }))}>
              {selectedProviders.length ? selectedProviders.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : <option value="">Add providers in Balances first</option>}
            </select>
          </label>
          <label>
            <span className="form-label">Description</span>
            <input type="text" value={txnDraft.desc} placeholder="Flight to NYC" onChange={(event) => setTxnDraft((draft) => ({ ...draft, desc: event.target.value }))} />
          </label>
          <label>
            <span className="form-label">Points (+/-)</span>
            <input type="number" value={txnDraft.pts} placeholder="5000" onChange={(event) => setTxnDraft((draft) => ({ ...draft, pts: event.target.value }))} />
          </label>
          <button className="btn" type="submit" disabled={!selectedProviders.length}>Add</button>
        </form>
      </div>
      <div className="card spacious">
        <SectionTitle>Transaction history</SectionTitle>
        <div className="txn-hdr">
          <span>Date</span><span>Provider</span><span className="right">Points</span><span>Description</span><span />
        </div>
        <div className="txn-list">
          {state.ptTxns.length ? [...state.ptTxns].reverse().map((txn) => {
            const providerInfo = providerById(txn.provider);
            return (
              <div className="txn-item" key={txn.id}>
                <span className="txn-date">{txn.date}</span>
                <span className="txn-name"><span className="bdot" style={{ background: providerInfo?.color || '#888' }} />{providerInfo?.name || txn.provider}</span>
                <span className={txn.pts >= 0 ? 'pts-earn' : 'pts-redeem'}>{txn.pts >= 0 ? '+' : ''}{fmtP(txn.pts)}</span>
                <span className="txn-desc">{txn.desc}</span>
                <button className="del-btn" type="button" onClick={() => deleteTxn(txn.id)} aria-label={`Delete ${txn.desc}`}>×</button>
              </div>
            );
          }) : <div className="empty">No transactions yet.</div>}
        </div>
      </div>
    </>
  );
}

const appStyles = `
*,*::before,*::after{box-sizing:border-box}
html,body{min-height:100%;margin:0}
body{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:var(--text-primary);background:var(--bg-page);-webkit-font-smoothing:antialiased}
:root{
  --bg-page:#f5f4f0;--bg-primary:#fff;--bg-secondary:#f1efe9;--bg-tertiary:#e8e6e0;
  --text-primary:#1a1917;--text-secondary:#6b6963;--text-tertiary:#9c9890;
  --border-subtle:rgba(0,0,0,.09);--border-medium:rgba(0,0,0,.16);--border-strong:rgba(0,0,0,.26);
  --green-bg:#eaf3de;--green-text:#3b6d11;--red-bg:#fcebeb;--red-text:#a32d2d;--purple-bg:#eeedfe;--purple-text:#534ab7;
}
@media(prefers-color-scheme:dark){
  :root{--bg-page:#181715;--bg-primary:#222120;--bg-secondary:#2b2a28;--bg-tertiary:#353330;--text-primary:#eeebe6;--text-secondary:#a19d96;--text-tertiary:#6e6a63;--border-subtle:rgba(255,255,255,.08);--border-medium:rgba(255,255,255,.14);--border-strong:rgba(255,255,255,.24);--green-bg:#172910;--green-text:#74c24a;--red-bg:#2a0f0f;--red-text:#ef7070;--purple-bg:#1c1938;--purple-text:#a89ef5}
}
button,input,select{font:inherit}
button{cursor:pointer}
.dashboard-shell{max-width:980px;margin:0 auto;padding:0 1.25rem 4rem}
.app-header{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;padding:1.7rem 0 1rem;border-bottom:.5px solid var(--border-subtle)}
.eyebrow{margin:0 0 2px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-tertiary);font-weight:600}
h1{margin:0;font-size:21px;font-weight:560;letter-spacing:0;color:var(--text-primary)}
.header-status{display:flex;align-items:center;gap:10px;min-height:24px}
.cloud-pill{display:inline-flex;align-items:center;border:.5px solid var(--border-medium);border-radius:99px;padding:3px 9px;font-size:11px;font-weight:650;color:var(--text-secondary);background:var(--bg-primary);white-space:nowrap}.cloud-pill.good{background:var(--green-bg);color:var(--green-text);border-color:transparent}.cloud-pill.warn{background:var(--red-bg);color:var(--red-text);border-color:transparent}
.save-indicator{font-size:11px;color:var(--text-tertiary);opacity:0;transition:opacity .25s}.save-indicator.show{opacity:1}
.tabs,.sub-tabs{display:flex;gap:0;border-bottom:.5px solid var(--border-subtle);overflow-x:auto;scrollbar-width:none}.tabs{margin-bottom:1.5rem}.tabs::-webkit-scrollbar,.sub-tabs::-webkit-scrollbar{display:none}
.tab,.sub-tab{border:0;background:transparent;color:var(--text-secondary);border-bottom:2px solid transparent;margin-bottom:-.5px;white-space:nowrap;transition:color .15s,border-color .15s}
.tab{padding:10px 18px;font-size:13px;font-weight:550}.sub-tab{padding:7px 16px;font-size:12px;font-weight:550}.tab:hover,.sub-tab:hover,.tab.active,.sub-tab.active{color:var(--text-primary)}.tab.active,.sub-tab.active{border-bottom-color:var(--text-primary)}
.sub-tabs{margin-bottom:1.25rem}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:10px;margin-bottom:1.25rem}
.metric{background:var(--bg-secondary);border-radius:8px;padding:12px 14px;min-width:0}.metric-label{font-size:12px;color:var(--text-secondary);margin-bottom:4px}.metric-value{font-size:20px;line-height:1.15;font-weight:560;color:var(--text-primary);letter-spacing:0;font-variant-numeric:tabular-nums}.metric-sub{font-size:11px;color:var(--text-tertiary);margin-top:4px}.tone-good{color:var(--green-text)}.tone-danger{color:var(--red-text)}.sub-good{color:var(--green-text)}.sub-danger{color:var(--red-text)}
.card{background:var(--bg-primary);border:.5px solid var(--border-subtle);border-radius:12px;padding:1rem 1.25rem}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.25rem}.spacious{margin-top:1.25rem}.spacious-top{margin-top:1rem}.chart-wrap{position:relative;width:100%;background:transparent}.chart-wrap.tall{height:auto}
.auth-shell{min-height:100vh;display:grid;align-content:center}.auth-screen{display:grid;grid-template-columns:minmax(0,420px);justify-content:center;width:100%;gap:1rem;align-items:stretch}.auth-hero,.auth-card{background:var(--bg-primary);border:.5px solid var(--border-subtle);border-radius:12px;padding:1.25rem}.auth-hero{display:flex;flex-direction:column;justify-content:space-between;min-height:390px}.auth-hero h1{font-size:34px;line-height:1.05;max-width:520px;margin-top:10px}.auth-copy{color:var(--text-secondary);max-width:500px;margin:14px 0 0}.auth-preview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:2rem}.auth-card{display:grid;gap:18px;align-content:center}.auth-screen-form{display:grid;gap:10px}.auth-screen-form input{text-align:left}
.storage-panel{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;background:var(--bg-primary);border:.5px solid var(--border-subtle);border-radius:12px;padding:12px 14px;margin:-.25rem 0 1.25rem}.storage-panel.embedded{margin:0;background:var(--bg-secondary)}.storage-copy{display:flex;align-items:center;gap:10px;min-width:0}.storage-copy strong{display:block;font-size:13px;font-weight:650;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.storage-copy p{margin:1px 0 0;font-size:12px;color:var(--text-secondary);line-height:1.35}.status-dot{width:9px;height:9px;border-radius:50%;background:var(--text-tertiary);flex:none}.status-dot.good{background:var(--green-text)}.status-dot.warn{background:var(--red-text)}.auth-form{display:grid;grid-template-columns:160px 160px auto auto;gap:8px;align-items:center}.auth-form input{text-align:left}.auth-error{grid-column:1/-1;color:var(--red-text);font-size:12px}.link-button{border:0;background:transparent;color:var(--text-secondary);font-size:12px;padding:4px 0}.link-button:hover{color:var(--text-primary)}.storage-note{font-size:12px;color:var(--text-secondary);white-space:nowrap}
.income-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}.income-head .section-title{margin-bottom:0}.income-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.no-bottom{margin-bottom:0}
.onboarding-card{background:var(--bg-primary);border:.5px solid var(--border-subtle);border-radius:12px;padding:1rem 1.25rem;margin-bottom:1.5rem}.onboarding-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:12px}.onboarding-head h2{margin:0;font-size:18px;font-weight:560;letter-spacing:0}.stepper{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin-bottom:14px}.step{display:flex;align-items:center;justify-content:center;gap:5px;border:.5px solid var(--border-subtle);border-radius:8px;background:var(--bg-secondary);color:var(--text-secondary);font-size:11px;padding:6px 5px;white-space:nowrap}.step span{display:grid;place-items:center;width:16px;height:16px;border-radius:50%;background:var(--bg-tertiary);font-size:10px}.step.active{border-color:var(--border-strong);color:var(--text-primary);background:var(--bg-primary)}.step.done span{background:var(--green-bg);color:var(--green-text)}.onboarding-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.choice-card{border:.5px solid var(--border-subtle);border-radius:12px;background:var(--bg-secondary);padding:14px;text-align:left;color:var(--text-primary);display:grid;gap:6px;min-height:118px}.choice-card strong{font-size:14px}.choice-card span{font-size:12px;color:var(--text-secondary);line-height:1.45}.choice-card.active{border:1.5px solid rgba(24,95,165,.5);background:rgba(24,95,165,.07)}.setup-stack{display:grid;gap:12px}.onboarding-fields{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.quick-provider-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.quick-provider{border:.5px solid var(--border-subtle);border-radius:10px;background:var(--bg-secondary);padding:8px;display:grid;gap:7px}.quick-provider.selected{background:rgba(24,95,165,.07);border-color:rgba(24,95,165,.5)}.quick-provider button{border:0;background:transparent;color:var(--text-primary);display:flex;align-items:center;gap:7px;text-align:left;padding:0;font-size:13px;font-weight:650}.review-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.onboarding-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.primary-btn{background:var(--text-primary);color:var(--bg-primary);border-color:var(--text-primary)}
.matrix-wrap{overflow-x:auto;border:.5px solid var(--border-subtle);border-radius:12px;background:var(--bg-secondary)}.month-matrix{min-width:920px;display:grid}.matrix-row{display:grid;grid-template-columns:120px repeat(12,1fr);gap:6px;align-items:center;padding:7px 8px;border-bottom:.5px solid var(--border-subtle)}.matrix-row:last-child{border-bottom:0}.matrix-row strong{font-size:12px;color:var(--text-primary)}.matrix-row input{padding:5px 6px;font-size:12px}.matrix-head{position:sticky;top:0;background:var(--bg-tertiary);z-index:1}.matrix-head span{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-secondary);font-weight:650;text-align:right}.category-matrix{min-width:1040px}
.section-title{font-size:11px;font-weight:650;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}.helper-text{font-size:12px;color:var(--text-secondary);margin:0 0 12px;line-height:1.5}.muted{color:var(--text-secondary)}
.legend{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:10px;font-size:12px;color:var(--text-secondary);align-items:center}.leg-dot{width:10px;height:10px;border-radius:2px;display:inline-block;margin-right:5px;vertical-align:middle}
.overview-chart-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:4px}.overview-chart-head .legend{margin-bottom:0}.segmented{display:inline-flex;align-items:center;border:.5px solid var(--border-medium);border-radius:8px;background:var(--bg-secondary);padding:2px;flex:none}.segmented button{border:0;border-radius:6px;background:transparent;color:var(--text-secondary);font-size:12px;font-weight:650;padding:4px 10px;min-width:66px}.segmented button:hover{color:var(--text-primary)}.segmented button.active{background:var(--bg-primary);color:var(--text-primary);box-shadow:0 1px 3px rgba(0,0,0,.08)}
.chart{display:block;width:100%;height:auto;overflow:visible}.grid-line{stroke:var(--border-subtle);stroke-width:1}.axis-label,.x-label{fill:var(--text-tertiary);font-size:11px}.x-label{fill:var(--text-secondary)}
.sankey-chart{min-height:240px}.sankey-label,.sankey-source-label{fill:var(--text-primary);font-size:13px;font-weight:650}.sankey-value,.sankey-source-value{fill:var(--text-secondary);font-size:12px;font-variant-numeric:tabular-nums}
input[type=number],input[type=text],input[type=email],input[type=password],input[type=date],select{background:var(--bg-secondary);border:.5px solid var(--border-medium);border-radius:8px;padding:6px 9px;font-size:13px;color:var(--text-primary);width:100%;transition:border-color .15s,background .15s}input[type=number]{text-align:right;-moz-appearance:textfield}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{appearance:none}input:focus,select:focus{outline:none;border-color:var(--border-strong)}input[readonly],input:disabled{opacity:.55;cursor:default}input[type=range]{flex:1;accent-color:var(--text-primary);cursor:pointer}
.btn{padding:7px 16px;font-size:13px;border:.5px solid var(--border-medium);border-radius:8px;background:var(--bg-primary);color:var(--text-primary);white-space:nowrap}.btn:hover{background:var(--bg-secondary)}.btn:disabled{opacity:.45;cursor:not-allowed}
.proj-controls{display:flex;flex-direction:column;gap:14px}.ctrl-row{display:flex;align-items:center;gap:12px}.ctrl-label{font-size:13px;color:var(--text-secondary);min-width:120px}.ctrl-val{font-size:13px;font-weight:600;min-width:60px;text-align:right;font-variant-numeric:tabular-nums}
.bar-list{display:grid;gap:6px}.bbar{display:grid;grid-template-columns:96px 1fr 58px;gap:8px;align-items:center;font-size:12px}.bbar-label{color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bbar-track{height:5px;background:var(--bg-tertiary);border-radius:99px;overflow:hidden}.bbar-fill{height:100%;border-radius:99px}.bbar-val{color:var(--text-secondary);text-align:right;font-size:11px}
.corr-grid,.inv-row{display:grid;gap:8px;align-items:center;padding:7px 0;border-bottom:.5px solid var(--border-subtle);font-size:13px}.corr-grid{grid-template-columns:60px 1fr 1fr 1fr}.inv-row{grid-template-columns:60px 1fr 1fr 1fr 80px}.corr-grid:last-child,.inv-row:last-child{border-bottom:0}.header-row{padding-bottom:6px;color:var(--text-secondary);font-size:11px;font-weight:650;text-transform:uppercase;letter-spacing:.04em}
.badge{font-size:11px;padding:2px 7px;border-radius:99px;white-space:nowrap;font-weight:650}.badge-g{background:var(--green-bg);color:var(--green-text)}.badge-r{background:var(--red-bg);color:var(--red-text)}.badge-p{background:var(--purple-bg);color:var(--purple-text)}.badge-trad{background:rgba(24,95,165,.1);color:#185FA5}
.progress-track{height:6px;background:var(--bg-tertiary);border-radius:99px;overflow:hidden}.progress-fill{height:100%;border-radius:99px;transition:width .3s ease}
.ret-account-card{background:var(--bg-secondary);border-radius:10px;padding:14px 16px;border:.5px solid var(--border-subtle);margin-top:12px}.ret-account-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.ret-account-name{font-size:14px;font-weight:650;color:var(--text-primary)}.ret-account-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:6px}.ret-stat{display:flex;flex-direction:column;gap:2px}.ret-stat-label{font-size:11px;color:var(--text-secondary)}.ret-stat-value{font-size:14px;font-weight:600;color:var(--text-primary);font-variant-numeric:tabular-nums}
.ret-account-form{background:var(--bg-secondary);border-radius:10px;padding:14px 16px;margin-bottom:14px;border:.5px solid var(--border-medium)}.ret-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.ret-form-actions{display:flex;justify-content:flex-end;gap:8px}.ret-link-label{grid-column:1/-1}.ret-link-row{display:flex;align-items:center;gap:12px;margin-top:3px}.ret-checkbox-label{display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;white-space:nowrap}.ret-checkbox-label input{width:auto}.ret-linked-note{font-size:12px;color:var(--text-secondary)}
.ret-limit-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px}.ret-birth-row{display:flex;align-items:center;gap:12px;margin-top:6px}.ret-warning{display:flex;flex-direction:column;gap:4px;border-color:rgba(186,117,23,.4);background:rgba(186,117,23,.06)}.ret-warning strong{font-size:12px;color:#7a4a00}.ret-warning span{font-size:12px;color:var(--text-secondary)}
.ret-withdraw-row{display:grid;gap:12px;align-items:center;padding:8px 0;border-bottom:.5px solid var(--border-subtle);font-size:13px}.ret-withdraw-row:last-child{border-bottom:0}.ret-tax-split{display:flex;flex-direction:column;gap:0}
@media(max-width:720px){.ret-account-stats{grid-template-columns:repeat(2,1fr)}.ret-form-grid{grid-template-columns:1fr}}
.cat-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:1rem}.cat-tab{padding:5px 14px;font-size:12px;border:.5px solid var(--border-medium);border-radius:99px;background:transparent;color:var(--text-secondary)}.cat-tab:hover{border-color:var(--border-strong);color:var(--text-primary)}.cat-tab.active{background:var(--text-primary);color:var(--bg-primary);border-color:var(--text-primary)}
.provider-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:10px;margin-bottom:1.25rem}.pcard{border:.5px solid var(--border-subtle);border-radius:12px;padding:14px;cursor:pointer;transition:border-color .15s,background .15s;position:relative;background:var(--bg-primary);min-height:82px}.pcard.sel{border:1.5px solid rgba(24,95,165,.5);background:rgba(24,95,165,.07)}.pcard:hover:not(.sel){border-color:var(--border-medium);background:var(--bg-secondary)}.pcard-name{font-size:13px;font-weight:650;color:var(--text-primary);margin-bottom:6px;padding-right:18px}.pcard-pts{font-size:19px;font-weight:560;letter-spacing:0;font-variant-numeric:tabular-nums}.pcard-sub,.pcard-hint{font-size:12px;color:var(--text-secondary)}.check-icon{position:absolute;top:10px;right:10px;width:17px;height:17px;border-radius:50%;background:rgba(24,95,165,.08);border:1.5px solid rgba(24,95,165,.5);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--text-primary)}.inline-field{display:block;margin-top:10px}.inline-field span,.form-label{display:block;font-size:11px;color:var(--text-secondary);margin-bottom:3px}
.bal-row{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:8px 0;border-bottom:.5px solid var(--border-subtle);font-size:13px}.bal-row:last-child{border-bottom:0}.bal-name{display:flex;align-items:center;gap:8px;min-width:0}.bdot{width:8px;height:8px;border-radius:2px;flex:none;display:inline-block}.bal-pts{font-weight:650;min-width:90px;text-align:right;font-variant-numeric:tabular-nums}
.donut-wrap{display:grid;grid-template-columns:200px 1fr;gap:12px;align-items:center}.donut{width:200px;height:200px}.donut-total{fill:var(--text-primary);font-size:19px;font-weight:650}.donut-label{fill:var(--text-secondary);font-size:11px}.donut-legend{display:grid;gap:8px;font-size:12px;color:var(--text-secondary)}
.txn-form{display:grid;grid-template-columns:1fr 1fr 110px auto;gap:8px;align-items:end}.txn-hdr,.txn-item{display:grid;grid-template-columns:72px 1fr 90px 1fr 24px;gap:8px;align-items:center}.txn-hdr{padding-bottom:6px;border-bottom:.5px solid var(--border-subtle);font-size:11px;font-weight:650;text-transform:uppercase;letter-spacing:.04em;color:var(--text-secondary)}.txn-list{display:flex;flex-direction:column;max-height:280px;overflow:auto}.txn-item{padding:6px 0;border-bottom:.5px solid var(--border-subtle);font-size:12px}.txn-date,.txn-desc{color:var(--text-secondary)}.txn-name{display:flex;align-items:center;gap:5px;font-weight:650}.txn-desc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pts-earn{color:var(--green-text);font-weight:650;text-align:right}.pts-redeem{color:var(--red-text);font-weight:650;text-align:right}.right{text-align:right}.del-btn{cursor:pointer;color:var(--text-tertiary);font-size:18px;line-height:1;border:0;background:transparent;padding:0;text-align:center}.del-btn:hover{color:var(--text-primary)}
.empty{text-align:center;padding:2rem;color:var(--text-secondary);font-size:13px}.large-empty{background:var(--bg-primary);border:.5px solid var(--border-subtle);border-radius:12px}
.event-list{display:grid;gap:0;margin-top:12px}.event-row{display:grid;grid-template-columns:38px 1fr auto auto;gap:12px;align-items:center;padding:10px 0;border-bottom:.5px solid var(--border-subtle)}.event-row:last-child{border-bottom:0}.event-month-tag{background:var(--bg-tertiary);color:var(--text-secondary);border-radius:6px;font-size:10px;font-weight:700;text-align:center;padding:4px 2px;letter-spacing:.04em;text-transform:uppercase}.event-name{font-size:13px;font-weight:550;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.event-amounts{display:flex;align-items:center;gap:7px;font-size:12px;white-space:nowrap}.event-gross-amt{font-weight:600;color:var(--text-primary);font-variant-numeric:tabular-nums}.event-arrow{color:var(--text-tertiary);font-size:11px}.event-net-amt{color:var(--green-text);font-weight:600;font-variant-numeric:tabular-nums}.event-ret-note{color:var(--text-tertiary);font-size:11px}.event-actions{display:flex;gap:6px;align-items:center;flex-shrink:0}.icon-btn{border:.5px solid var(--border-medium);background:transparent;color:var(--text-secondary);font-size:11px;font-weight:650;padding:3px 9px;border-radius:6px;cursor:pointer;white-space:nowrap}.icon-btn:hover{background:var(--bg-secondary);color:var(--text-primary)}.event-edit-card{background:var(--bg-secondary);border-radius:10px;padding:14px 16px;margin:10px 0;border:.5px solid var(--border-medium)}.event-form{display:grid;gap:12px}.event-form-top{display:grid;grid-template-columns:1fr 140px;gap:10px}.event-form-amounts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;align-items:end}.event-computed-field{display:flex;flex-direction:column;padding-bottom:1px}.event-computed-val{font-size:18px;font-weight:560;color:var(--text-primary);padding:5px 0 6px;font-variant-numeric:tabular-nums;letter-spacing:0}.event-net-positive{color:var(--green-text)}.event-form-actions{display:flex;justify-content:flex-end;gap:8px;padding-top:2px}.event-empty{padding:1.5rem 0 .5rem;color:var(--text-secondary);font-size:13px}.event-summary{border-top:.5px solid var(--border-subtle);padding-top:10px;margin-top:4px;font-size:12px;color:var(--text-secondary)}.event-summary strong{color:var(--text-primary);font-variant-numeric:tabular-nums}
@media(max-width:720px){.event-row{grid-template-columns:34px 1fr auto}.event-amounts{display:none}.event-form-top{grid-template-columns:1fr}.event-form-amounts{grid-template-columns:1fr 1fr 1fr 1fr}}
@media(max-width:900px){.auth-screen{grid-template-columns:1fr}.auth-hero{min-height:auto}.auth-preview{grid-template-columns:1fr 1fr}.auth-form{grid-template-columns:1fr 1fr auto}.auth-form .link-button{grid-column:1/-1;justify-self:start}.income-form{grid-template-columns:repeat(2,minmax(0,1fr))}.onboarding-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.onboarding-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.quick-provider-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.review-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.stepper{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:720px){.dashboard-shell{padding:0 1rem 3rem}.two-col{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.ctrl-row{display:grid;grid-template-columns:1fr auto}.ctrl-row input{grid-column:1/-1}.storage-panel{grid-template-columns:1fr}.auth-form{grid-template-columns:1fr 1fr}.auth-form .btn{grid-column:1/-1}.txn-form{grid-template-columns:1fr 1fr}.txn-form .btn{grid-column:1/-1}.donut-wrap{grid-template-columns:1fr;justify-items:center}.corr-grid{grid-template-columns:50px 1fr 1fr 76px}.inv-row{grid-template-columns:44px 1fr 1fr 72px 54px;font-size:12px}.tab{padding-left:14px;padding-right:14px}.overview-chart-head,.income-head{align-items:stretch;flex-direction:column}.segmented{align-self:flex-start}.income-head .btn{align-self:flex-start}}
@media(max-width:480px){.metrics,.auth-preview,.income-form{grid-template-columns:1fr}.auth-hero h1{font-size:28px}.app-header{align-items:flex-start;flex-direction:column}.header-status{width:100%;justify-content:space-between}.stepper,.onboarding-grid,.onboarding-fields,.quick-provider-grid,.review-grid{grid-template-columns:1fr}.txn-hdr,.txn-item{grid-template-columns:70px 1fr 70px 24px}.txn-hdr span:nth-child(4),.txn-item .txn-desc{display:none}.bbar{grid-template-columns:82px 1fr 48px}.card,.onboarding-card,.auth-hero,.auth-card{padding:.9rem}.chart{min-width:620px}.chart-wrap{overflow-x:auto}.provider-grid{grid-template-columns:1fr}.bal-row{grid-template-columns:1fr auto}.bal-row > span:last-child{grid-column:1/-1;justify-self:start}}
`;
