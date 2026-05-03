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
  invest: '#0F6E56',
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
  { key: 'spending', label: 'Spending' },
  { key: 'investments', label: 'Investments' },
  { key: 'projection', label: 'Projection' },
  { key: 'points', label: 'Points & Miles' },
];

const subTabs = [
  { key: 'balances', label: 'Balances' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'transactions', label: 'Transactions' },
];

const onboardingSteps = ['Focus', 'Monthly Plan', 'Categories', 'Actuals', 'Projection', 'Points', 'Review'];

const initialState = {
  plan: createDefaultPlan(),
  spAct: Array(12).fill(null),
  userInv: {},
  projRate: 7,
  projYears: 10,
  projMonthly: 0,
  ptSelected: {},
  ptBalances: {},
  ptTxns: [],
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

function normalizeDashboardState(payload) {
  const source = payload?.dashboardState && typeof payload.dashboardState === 'object'
    ? payload.dashboardState
    : payload;

  if (!source || typeof source !== 'object' || Array.isArray(source)) return initialState;

  return {
    ...initialState,
    ...source,
    plan: normalizePlan(source.plan),
    spAct: Array.isArray(source.spAct)
      ? source.spAct.slice(0, 12).concat(Array(12).fill(null)).slice(0, 12)
      : initialState.spAct,
    userInv: source.userInv && typeof source.userInv === 'object' && !Array.isArray(source.userInv) ? source.userInv : {},
    ptSelected: source.ptSelected && typeof source.ptSelected === 'object' && !Array.isArray(source.ptSelected) ? source.ptSelected : {},
    ptBalances: source.ptBalances && typeof source.ptBalances === 'object' && !Array.isArray(source.ptBalances) ? source.ptBalances : {},
    ptTxns: Array.isArray(source.ptTxns) ? source.ptTxns : [],
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

function GroupedBarChart({ labels, datasets, height = 240 }) {
  const width = 900;
  const padding = { top: 14, right: 20, bottom: 28, left: 54 };
  const scale = makeScale(datasets.map((dataset) => dataset.data));
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const groupW = innerW / labels.length;
  const barW = groupW / datasets.length * 0.62;
  const zeroY = padding.top + (1 - (0 - scale.min) / (scale.max - scale.min)) * innerH;

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
        const x = padding.left + (i + 0.5) * groupW;
        return <text className="x-label" key={label} x={x} y={height - 6} textAnchor="middle">{label}</text>;
      })}
      {datasets.map((dataset, dsIndex) => (
        <g key={dataset.label}>
          {dataset.data.map((value, i) => {
            const groupX = padding.left + i * groupW;
            const x = groupX + (groupW - barW * datasets.length) / 2 + dsIndex * barW;
            const y = padding.top + (1 - (value - scale.min) / (scale.max - scale.min)) * innerH;
            const top = Math.min(y, zeroY);
            const h = Math.max(2, Math.abs(y - zeroY));
            const fill = Array.isArray(dataset.color) ? dataset.color[i] : dataset.color;
            return <rect key={i} x={x} y={top} width={barW - 2} height={h} rx="3" fill={fill} opacity="0.82" />;
          })}
        </g>
      ))}
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
            {activeMain === 'spending' ? <Spending state={state} plan={plan} setSpAct={setSpAct} /> : null}
            {activeMain === 'investments' ? <Investments state={state} derived={derived} plan={plan} /> : null}
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
      <section className="auth-hero">
        <p className="eyebrow">Balance Tracker</p>
        <h1>Build your 2026 finance dashboard.</h1>
        <p className="auth-copy">Cloud-only planning for cashflow, investment anchors, spending corrections, and points balances.</p>
        <div className="auth-preview">
          <Metric label="Storage" value={storageStatus.label} sub={storageStatus.detail} tone={storageStatus.tone === 'good' ? 'good' : undefined} />
          <Metric label="Setup" value="Onboarding" sub="No personal defaults baked in" />
          <Metric label="Save mode" value="Neon" sub="Cloud database only" tone="good" />
        </div>
      </section>
      <section className="auth-card">
        <div>
          <SectionTitle>{authMode === 'register' ? 'Create account' : 'Sign in'}</SectionTitle>
          <p className="helper-text">
            {loading ? 'Checking Neon and your session.' : storageBlocked ? 'Cloud storage must be available before the dashboard can open.' : 'Use your account to load and save the dashboard in Neon.'}
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
  const totalIncome = plan.income.reduce((sum, value) => sum + value, 0);
  const totalInvested = plan.investing.reduce((sum, value) => sum + value, 0);
  const totalRent = plan.rent.reduce((sum, value) => sum + value, 0);
  const totalSpending = MONTHS.reduce((sum, _, i) => sum + derived.effectiveSpend(i), 0);
  const entered = state.spAct.filter((value) => value !== null && value !== undefined).length;
  const spendColors = MONTHS.map((_, i) => {
    if (state.spAct[i] === null || state.spAct[i] === undefined) return `${colors.spend}77`;
    return derived.effectiveSpend(i) > plan.budgetSp[i] ? `${colors.danger}cc` : `${colors.actual}cc`;
  });
  const cashflow = MONTHS.map((_, i) => derived.effectiveCashflow(i));

  return (
    <>
      <div className="metrics">
        <Metric label="Annual income" value={fmtS(totalIncome)} sub="post-tax plan" />
        <Metric label="Total invested" value={fmtS(totalInvested)} sub="401k + brokerage" />
        <Metric label="Total rent" value={fmtS(totalRent)} sub="incl. utilities" />
        <Metric label="Spending" value={fmtS(totalSpending)} sub={entered ? `${entered} months corrected` : 'budgeted'} />
        <Metric label="Year-end bank" value={fmtS(derived.bank[11])} sub="uninvested cashflow" tone={derived.bank[11] >= 0 ? 'good' : 'danger'} />
      </div>
      <Legend items={[
        { label: 'Income', color: colors.income },
        { label: 'Invested', color: colors.invest },
        { label: 'Rent', color: colors.rent },
        { label: 'Spending', color: colors.spend },
      ]} />
      <div className="chart-wrap tall">
        <GroupedBarChart
          labels={MONTHS}
          datasets={[
            { label: 'Income', data: plan.income, color: colors.income },
            { label: 'Invested', data: plan.investing, color: colors.invest },
            { label: 'Rent', data: plan.rent, color: colors.rent },
            { label: 'Spending', data: MONTHS.map((_, i) => derived.effectiveSpend(i)), color: spendColors },
          ]}
          height={250}
        />
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

function Investments({ state, derived, plan }) {
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
.auth-shell{min-height:100vh;display:grid;align-content:center}.auth-screen{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,.7fr);gap:1rem;align-items:stretch}.auth-hero,.auth-card{background:var(--bg-primary);border:.5px solid var(--border-subtle);border-radius:12px;padding:1.25rem}.auth-hero{display:flex;flex-direction:column;justify-content:space-between;min-height:390px}.auth-hero h1{font-size:34px;line-height:1.05;max-width:520px;margin-top:10px}.auth-copy{color:var(--text-secondary);max-width:500px;margin:14px 0 0}.auth-preview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:2rem}.auth-card{display:grid;gap:18px;align-content:center}.auth-screen-form{display:grid;gap:10px}.auth-screen-form input{text-align:left}
.storage-panel{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;background:var(--bg-primary);border:.5px solid var(--border-subtle);border-radius:12px;padding:12px 14px;margin:-.25rem 0 1.25rem}.storage-panel.embedded{margin:0;background:var(--bg-secondary)}.storage-copy{display:flex;align-items:center;gap:10px;min-width:0}.storage-copy strong{display:block;font-size:13px;font-weight:650;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.storage-copy p{margin:1px 0 0;font-size:12px;color:var(--text-secondary);line-height:1.35}.status-dot{width:9px;height:9px;border-radius:50%;background:var(--text-tertiary);flex:none}.status-dot.good{background:var(--green-text)}.status-dot.warn{background:var(--red-text)}.auth-form{display:grid;grid-template-columns:160px 160px auto auto;gap:8px;align-items:center}.auth-form input{text-align:left}.auth-error{grid-column:1/-1;color:var(--red-text);font-size:12px}.link-button{border:0;background:transparent;color:var(--text-secondary);font-size:12px;padding:4px 0}.link-button:hover{color:var(--text-primary)}.storage-note{font-size:12px;color:var(--text-secondary);white-space:nowrap}
.onboarding-card{background:var(--bg-primary);border:.5px solid var(--border-subtle);border-radius:12px;padding:1rem 1.25rem;margin-bottom:1.5rem}.onboarding-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:12px}.onboarding-head h2{margin:0;font-size:18px;font-weight:560;letter-spacing:0}.stepper{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin-bottom:14px}.step{display:flex;align-items:center;justify-content:center;gap:5px;border:.5px solid var(--border-subtle);border-radius:8px;background:var(--bg-secondary);color:var(--text-secondary);font-size:11px;padding:6px 5px;white-space:nowrap}.step span{display:grid;place-items:center;width:16px;height:16px;border-radius:50%;background:var(--bg-tertiary);font-size:10px}.step.active{border-color:var(--border-strong);color:var(--text-primary);background:var(--bg-primary)}.step.done span{background:var(--green-bg);color:var(--green-text)}.onboarding-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.choice-card{border:.5px solid var(--border-subtle);border-radius:12px;background:var(--bg-secondary);padding:14px;text-align:left;color:var(--text-primary);display:grid;gap:6px;min-height:118px}.choice-card strong{font-size:14px}.choice-card span{font-size:12px;color:var(--text-secondary);line-height:1.45}.choice-card.active{border:1.5px solid rgba(24,95,165,.5);background:rgba(24,95,165,.07)}.setup-stack{display:grid;gap:12px}.onboarding-fields{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.quick-provider-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.quick-provider{border:.5px solid var(--border-subtle);border-radius:10px;background:var(--bg-secondary);padding:8px;display:grid;gap:7px}.quick-provider.selected{background:rgba(24,95,165,.07);border-color:rgba(24,95,165,.5)}.quick-provider button{border:0;background:transparent;color:var(--text-primary);display:flex;align-items:center;gap:7px;text-align:left;padding:0;font-size:13px;font-weight:650}.review-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.onboarding-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.primary-btn{background:var(--text-primary);color:var(--bg-primary);border-color:var(--text-primary)}
.matrix-wrap{overflow-x:auto;border:.5px solid var(--border-subtle);border-radius:12px;background:var(--bg-secondary)}.month-matrix{min-width:920px;display:grid}.matrix-row{display:grid;grid-template-columns:120px repeat(12,1fr);gap:6px;align-items:center;padding:7px 8px;border-bottom:.5px solid var(--border-subtle)}.matrix-row:last-child{border-bottom:0}.matrix-row strong{font-size:12px;color:var(--text-primary)}.matrix-row input{padding:5px 6px;font-size:12px}.matrix-head{position:sticky;top:0;background:var(--bg-tertiary);z-index:1}.matrix-head span{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-secondary);font-weight:650;text-align:right}.category-matrix{min-width:1040px}
.section-title{font-size:11px;font-weight:650;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}.helper-text{font-size:12px;color:var(--text-secondary);margin:0 0 12px;line-height:1.5}.muted{color:var(--text-secondary)}
.legend{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:10px;font-size:12px;color:var(--text-secondary);align-items:center}.leg-dot{width:10px;height:10px;border-radius:2px;display:inline-block;margin-right:5px;vertical-align:middle}
.chart{display:block;width:100%;height:auto;overflow:visible}.grid-line{stroke:var(--border-subtle);stroke-width:1}.axis-label,.x-label{fill:var(--text-tertiary);font-size:11px}.x-label{fill:var(--text-secondary)}
input[type=number],input[type=text],input[type=email],input[type=password],select{background:var(--bg-secondary);border:.5px solid var(--border-medium);border-radius:8px;padding:6px 9px;font-size:13px;color:var(--text-primary);width:100%;transition:border-color .15s,background .15s}input[type=number]{text-align:right;-moz-appearance:textfield}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{appearance:none}input:focus,select:focus{outline:none;border-color:var(--border-strong)}input[readonly]{opacity:.55;cursor:default}input[type=range]{flex:1;accent-color:var(--text-primary);cursor:pointer}
.btn{padding:7px 16px;font-size:13px;border:.5px solid var(--border-medium);border-radius:8px;background:var(--bg-primary);color:var(--text-primary);white-space:nowrap}.btn:hover{background:var(--bg-secondary)}.btn:disabled{opacity:.45;cursor:not-allowed}
.proj-controls{display:flex;flex-direction:column;gap:14px}.ctrl-row{display:flex;align-items:center;gap:12px}.ctrl-label{font-size:13px;color:var(--text-secondary);min-width:120px}.ctrl-val{font-size:13px;font-weight:600;min-width:60px;text-align:right;font-variant-numeric:tabular-nums}
.bar-list{display:grid;gap:6px}.bbar{display:grid;grid-template-columns:96px 1fr 58px;gap:8px;align-items:center;font-size:12px}.bbar-label{color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bbar-track{height:5px;background:var(--bg-tertiary);border-radius:99px;overflow:hidden}.bbar-fill{height:100%;border-radius:99px}.bbar-val{color:var(--text-secondary);text-align:right;font-size:11px}
.corr-grid,.inv-row{display:grid;gap:8px;align-items:center;padding:7px 0;border-bottom:.5px solid var(--border-subtle);font-size:13px}.corr-grid{grid-template-columns:60px 1fr 1fr 1fr}.inv-row{grid-template-columns:60px 1fr 1fr 1fr 80px}.corr-grid:last-child,.inv-row:last-child{border-bottom:0}.header-row{padding-bottom:6px;color:var(--text-secondary);font-size:11px;font-weight:650;text-transform:uppercase;letter-spacing:.04em}
.badge{font-size:11px;padding:2px 7px;border-radius:99px;white-space:nowrap;font-weight:650}.badge-g{background:var(--green-bg);color:var(--green-text)}.badge-r{background:var(--red-bg);color:var(--red-text)}.badge-p{background:var(--purple-bg);color:var(--purple-text)}
.cat-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:1rem}.cat-tab{padding:5px 14px;font-size:12px;border:.5px solid var(--border-medium);border-radius:99px;background:transparent;color:var(--text-secondary)}.cat-tab:hover{border-color:var(--border-strong);color:var(--text-primary)}.cat-tab.active{background:var(--text-primary);color:var(--bg-primary);border-color:var(--text-primary)}
.provider-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:10px;margin-bottom:1.25rem}.pcard{border:.5px solid var(--border-subtle);border-radius:12px;padding:14px;cursor:pointer;transition:border-color .15s,background .15s;position:relative;background:var(--bg-primary);min-height:82px}.pcard.sel{border:1.5px solid rgba(24,95,165,.5);background:rgba(24,95,165,.07)}.pcard:hover:not(.sel){border-color:var(--border-medium);background:var(--bg-secondary)}.pcard-name{font-size:13px;font-weight:650;color:var(--text-primary);margin-bottom:6px;padding-right:18px}.pcard-pts{font-size:19px;font-weight:560;letter-spacing:0;font-variant-numeric:tabular-nums}.pcard-sub,.pcard-hint{font-size:12px;color:var(--text-secondary)}.check-icon{position:absolute;top:10px;right:10px;width:17px;height:17px;border-radius:50%;background:rgba(24,95,165,.08);border:1.5px solid rgba(24,95,165,.5);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--text-primary)}.inline-field{display:block;margin-top:10px}.inline-field span,.form-label{display:block;font-size:11px;color:var(--text-secondary);margin-bottom:3px}
.bal-row{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:8px 0;border-bottom:.5px solid var(--border-subtle);font-size:13px}.bal-row:last-child{border-bottom:0}.bal-name{display:flex;align-items:center;gap:8px;min-width:0}.bdot{width:8px;height:8px;border-radius:2px;flex:none;display:inline-block}.bal-pts{font-weight:650;min-width:90px;text-align:right;font-variant-numeric:tabular-nums}
.donut-wrap{display:grid;grid-template-columns:200px 1fr;gap:12px;align-items:center}.donut{width:200px;height:200px}.donut-total{fill:var(--text-primary);font-size:19px;font-weight:650}.donut-label{fill:var(--text-secondary);font-size:11px}.donut-legend{display:grid;gap:8px;font-size:12px;color:var(--text-secondary)}
.txn-form{display:grid;grid-template-columns:1fr 1fr 110px auto;gap:8px;align-items:end}.txn-hdr,.txn-item{display:grid;grid-template-columns:72px 1fr 90px 1fr 24px;gap:8px;align-items:center}.txn-hdr{padding-bottom:6px;border-bottom:.5px solid var(--border-subtle);font-size:11px;font-weight:650;text-transform:uppercase;letter-spacing:.04em;color:var(--text-secondary)}.txn-list{display:flex;flex-direction:column;max-height:280px;overflow:auto}.txn-item{padding:6px 0;border-bottom:.5px solid var(--border-subtle);font-size:12px}.txn-date,.txn-desc{color:var(--text-secondary)}.txn-name{display:flex;align-items:center;gap:5px;font-weight:650}.txn-desc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pts-earn{color:var(--green-text);font-weight:650;text-align:right}.pts-redeem{color:var(--red-text);font-weight:650;text-align:right}.right{text-align:right}.del-btn{cursor:pointer;color:var(--text-tertiary);font-size:18px;line-height:1;border:0;background:transparent;padding:0;text-align:center}.del-btn:hover{color:var(--text-primary)}
.empty{text-align:center;padding:2rem;color:var(--text-secondary);font-size:13px}.large-empty{background:var(--bg-primary);border:.5px solid var(--border-subtle);border-radius:12px}
@media(max-width:900px){.auth-screen{grid-template-columns:1fr}.auth-hero{min-height:auto}.auth-preview{grid-template-columns:1fr 1fr}.auth-form{grid-template-columns:1fr 1fr auto}.auth-form .link-button{grid-column:1/-1;justify-self:start}.onboarding-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.onboarding-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.quick-provider-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.review-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.stepper{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:720px){.dashboard-shell{padding:0 1rem 3rem}.two-col{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.ctrl-row{display:grid;grid-template-columns:1fr auto}.ctrl-row input{grid-column:1/-1}.storage-panel{grid-template-columns:1fr}.auth-form{grid-template-columns:1fr 1fr}.auth-form .btn{grid-column:1/-1}.txn-form{grid-template-columns:1fr 1fr}.txn-form .btn{grid-column:1/-1}.donut-wrap{grid-template-columns:1fr;justify-items:center}.corr-grid{grid-template-columns:50px 1fr 1fr 76px}.inv-row{grid-template-columns:44px 1fr 1fr 72px 54px;font-size:12px}.tab{padding-left:14px;padding-right:14px}}
@media(max-width:480px){.metrics,.auth-preview{grid-template-columns:1fr}.auth-hero h1{font-size:28px}.app-header{align-items:flex-start;flex-direction:column}.header-status{width:100%;justify-content:space-between}.stepper,.onboarding-grid,.onboarding-fields,.quick-provider-grid,.review-grid{grid-template-columns:1fr}.txn-hdr,.txn-item{grid-template-columns:70px 1fr 70px 24px}.txn-hdr span:nth-child(4),.txn-item .txn-desc{display:none}.bbar{grid-template-columns:82px 1fr 48px}.card,.onboarding-card,.auth-hero,.auth-card{padding:.9rem}.chart{min-width:620px}.chart-wrap{overflow-x:auto}.provider-grid{grid-template-columns:1fr}.bal-row{grid-template-columns:1fr auto}.bal-row > span:last-child{grid-column:1/-1;justify-self:start}}
`;
