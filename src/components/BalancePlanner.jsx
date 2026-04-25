'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

const LEGACY_LOCAL_PLAN_KEY = 'baltrack.plan.v1';
const ONBOARDING_META_KEY = '__baltrackOnboarding';
const ONBOARDING_STEPS = [
  'Welcome',
  'Cash accounts',
  'Income',
  'Bills',
  'Credit cards',
  'Budget + reserve',
  'Investing',
  'Review',
];
const ONBOARDING_STEP_COUNT = ONBOARDING_STEPS.length;

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'cash', label: 'Cash / bank' },
  { value: 'investment', label: 'Investment' },
];

const INVESTMENT_SUBTYPE_OPTIONS = [
  { value: 'brokerage', label: 'Taxable brokerage' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: 'traditional_ira', label: 'Traditional IRA' },
  { value: 'traditional_401k', label: 'Traditional 401(k)' },
  { value: 'roth_401k', label: 'Roth 401(k)' },
  { value: 'other', label: 'Other investment' },
];

const FILING_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married_jointly', label: 'Married Filing Jointly' },
  { value: 'married_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
];

// 2026 federal income tax brackets (IRS Rev. Proc. 2025-40)
const FEDERAL_BRACKETS_2026 = {
  single: [
    { upTo: 12400, rate: 10 },
    { upTo: 50400, rate: 12 },
    { upTo: 105700, rate: 22 },
    { upTo: 201775, rate: 24 },
    { upTo: 256225, rate: 32 },
    { upTo: 640600, rate: 35 },
    { upTo: 0, rate: 37 },
  ],
  married_jointly: [
    { upTo: 24800, rate: 10 },
    { upTo: 100800, rate: 12 },
    { upTo: 211400, rate: 22 },
    { upTo: 403550, rate: 24 },
    { upTo: 512450, rate: 32 },
    { upTo: 768700, rate: 35 },
    { upTo: 0, rate: 37 },
  ],
  married_separately: [
    { upTo: 12400, rate: 10 },
    { upTo: 50400, rate: 12 },
    { upTo: 105700, rate: 22 },
    { upTo: 201775, rate: 24 },
    { upTo: 256225, rate: 32 },
    { upTo: 384350, rate: 35 },
    { upTo: 0, rate: 37 },
  ],
  head_of_household: [
    { upTo: 17800, rate: 10 },
    { upTo: 67400, rate: 12 },
    { upTo: 105700, rate: 22 },
    { upTo: 201775, rate: 24 },
    { upTo: 256225, rate: 32 },
    { upTo: 640600, rate: 35 },
    { upTo: 0, rate: 37 },
  ],
};

const FEDERAL_STANDARD_DEDUCTION_2026 = {
  single: 16100,
  married_jointly: 32200,
  married_separately: 16100,
  head_of_household: 24150,
};


const APP_STYLES = `
/* === TOKENS === */
:root {
  color-scheme: dark;
  --bg-0: #050d1a;
  --bg-1: #070f1e;
  --card: rgba(11, 20, 36, 0.8);
  --card-strong: rgba(14, 24, 42, 0.96);
  --line: rgba(255,255,255,0.065);
  --line-2: rgba(255,255,255,0.1);
  --line-3: rgba(255,255,255,0.15);
  --text: #eef2ff;
  --soft: #b8cae0;
  --muted: #7a8fa8;
  --dim: #4e6070;
  --primary: #6ea6ff;
  --primary-2: #4878ff;
  --primary-3: #93c5ff;
  --primary-bg: rgba(110,166,255,0.09);
  --primary-glow: rgba(72,120,255,0.3);
  --primary-border: rgba(110,166,255,0.22);
  --green: #4eeaa0;
  --green-muted: #2dd07a;
  --green-bg: rgba(78,234,160,0.09);
  --green-border: rgba(78,234,160,0.2);
  --warning: #f5b84a;
  --warning-bg: rgba(245,184,74,0.09);
  --warning-border: rgba(245,184,74,0.22);
  --danger: #ff6b6b;
  --danger-bg: rgba(255,107,107,0.09);
  --danger-border: rgba(255,107,107,0.22);
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.14);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.22), 0 12px 32px rgba(0,0,0,0.18);
  --shadow-lg: 0 8px 28px rgba(0,0,0,0.3), 0 20px 50px rgba(0,0,0,0.22);
  --shadow-xl: 0 16px 48px rgba(0,0,0,0.38), 0 32px 80px rgba(0,0,0,0.28);
  --radius-xl: 24px;
  --radius-lg: 18px;
  --radius-md: 12px;
  --radius-sm: 9px;
  --radius-xs: 7px;
  --transition: 150ms cubic-bezier(0.4,0,0.2,1);
}
/* === RESET === */
*{box-sizing:border-box;margin:0}
html,body{
  min-height:100%;
  font-family:'Inter',ui-sans-serif,system-ui,-apple-system,"SF Pro Display","Segoe UI",sans-serif;
  font-size:15px;line-height:1.5;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  font-feature-settings:'ss01' 1,'cv01' 1,'cv11' 1;
  background:
    radial-gradient(ellipse 80% 50% at 20% -10%,rgba(72,120,255,0.18) 0%,transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 5%,rgba(45,200,200,0.07) 0%,transparent 50%),
    radial-gradient(ellipse 100% 60% at 50% 100%,rgba(30,50,100,0.12) 0%,transparent 70%),
    linear-gradient(160deg,#060d1b 0%,#050b17 55%,#040912 100%);
  color:var(--text);
}
body{min-height:100vh}
a{color:inherit;text-decoration:none}
button,input,select{font:inherit;font-feature-settings:'ss01' 1}
button{
  border:none;cursor:pointer;
  transition:transform var(--transition),opacity var(--transition),background var(--transition),border-color var(--transition),box-shadow var(--transition),color var(--transition);
}
button:hover{transform:translateY(-1px)}
button:active{transform:translateY(0) scale(0.99)}
button:disabled{opacity:.45;cursor:not-allowed;transform:none}
input,select{
  width:100%;border-radius:var(--radius-md);
  border:1px solid var(--line-2);
  background:rgba(255,255,255,0.035);
  color:var(--text);padding:10px 13px;
  outline:none;
  transition:border-color var(--transition),box-shadow var(--transition),background var(--transition);
}
input::placeholder{color:var(--dim)}
input:hover{border-color:var(--line-3);background:rgba(255,255,255,0.05)}
input:focus,select:focus{
  border-color:rgba(110,166,255,0.75);
  background:rgba(110,166,255,0.04);
  box-shadow:0 0 0 3px rgba(110,166,255,0.12), 0 1px 3px rgba(0,0,0,0.2);
}
input::-webkit-calendar-picker-indicator{filter:invert(1) opacity(.55)}
select{appearance:none;padding-right:32px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%237a8fa8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;
  background-position:right 12px center;
}
/* === LOADING === */
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse-opacity{0%,100%{opacity:0.5}50%{opacity:1}}
.spinner{
  width:32px;height:32px;border-radius:50%;
  border:2.5px solid rgba(110,166,255,0.15);border-top-color:var(--primary);
  animation:spin 650ms linear infinite;
}
.loading-screen{min-height:100vh;display:grid;place-items:center;padding:24px}
.loading-card{
  display:flex;flex-direction:column;align-items:center;gap:18px;
  padding:52px 48px;border-radius:var(--radius-xl);
  background:linear-gradient(160deg,rgba(16,26,44,0.94),rgba(9,16,30,0.97));
  border:1px solid var(--line);box-shadow:var(--shadow-xl);
  backdrop-filter:blur(32px) saturate(160%);
  position:relative;overflow:hidden;
}
.loading-card::before{
  content:"";position:absolute;inset:0;border-radius:inherit;
  background:radial-gradient(ellipse at 50% 0%,rgba(110,166,255,0.06),transparent 60%);
  pointer-events:none;
}
.loading-card-brand{display:flex;align-items:center;gap:10px}
.loading-card-icon{
  width:36px;height:36px;border-radius:10px;
  background:linear-gradient(135deg,var(--primary) 0%,var(--primary-2) 100%);
  display:grid;place-items:center;
  box-shadow:0 6px 20px var(--primary-glow);
}
.loading-card-name{font-size:1.05rem;font-weight:800;letter-spacing:-0.03em;color:var(--text)}
.loading-card p{color:var(--muted);font-size:0.85rem;animation:pulse-opacity 2s ease infinite}
/* === AUTH === */
.auth-shell{
  min-height:100vh;display:grid;place-items:center;padding:24px;
  background:radial-gradient(ellipse 70% 50% at 30% 20%,rgba(72,120,255,0.12) 0%,transparent 60%);
}
.auth-card{
  width:min(100%,420px);display:grid;gap:24px;padding:36px 32px;
  border-radius:var(--radius-xl);
  background:linear-gradient(160deg,rgba(15,25,42,0.95),rgba(8,15,28,0.97));
  border:1px solid var(--line);
  box-shadow:var(--shadow-xl), inset 0 1px 0 rgba(255,255,255,0.05);
  backdrop-filter:blur(32px) saturate(160%);
  position:relative;overflow:hidden;
}
.auth-card::before{
  content:"";position:absolute;inset:0;border-radius:inherit;
  background:radial-gradient(ellipse at 50% -20%,rgba(110,166,255,0.07),transparent 60%);
  pointer-events:none;
}
.auth-card-brand{display:flex;align-items:center;gap:10px;margin-bottom:4px}
.auth-card-icon{
  width:34px;height:34px;border-radius:9px;
  background:linear-gradient(135deg,var(--primary) 0%,var(--primary-2) 100%);
  display:grid;place-items:center;flex:none;
  box-shadow:0 4px 16px var(--primary-glow);
}
.auth-card-name{font-size:0.95rem;font-weight:800;letter-spacing:-0.02em}
.auth-card h1{font-size:1.65rem;letter-spacing:-0.04em;line-height:1.15;color:var(--text)}
.auth-card > p{color:var(--muted);font-size:0.85rem;line-height:1.6;margin-top:-8px}
.auth-form{display:grid;gap:14px}
.auth-switch{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:2px}
.auth-error{
  padding:11px 14px;border-radius:var(--radius-md);
  color:var(--danger);background:var(--danger-bg);
  border:1px solid var(--danger-border);font-size:0.84rem;
  display:flex;align-items:center;gap:9px;
}
/* === APP SHELL === */
.app-shell,.onboarding-shell{
  min-height:100vh;display:grid;gap:18px;padding:18px;
}
.app-shell{grid-template-columns:268px minmax(0,1fr);align-items:start}
.onboarding-shell{grid-template-columns:300px minmax(0,1fr)}
/* === SIDEBAR === */
.sidebar,.onboarding-sidebar{
  position:sticky;top:18px;align-self:start;height:calc(100vh - 36px);
  border-radius:var(--radius-xl);
  background:linear-gradient(180deg,rgba(12,20,36,0.97),rgba(7,13,24,0.97));
  border:1px solid var(--line);
  box-shadow:var(--shadow-xl), inset 0 1px 0 rgba(255,255,255,0.04);
  backdrop-filter:blur(32px) saturate(160%);overflow:hidden;
  display:flex;flex-direction:column;
}
.sidebar-header{
  padding:20px 18px 15px;border-bottom:1px solid var(--line);flex:none;
}
.sidebar-brand{display:flex;align-items:center;gap:9px;margin-bottom:13px}
.sidebar-brand-icon{
  width:28px;height:28px;border-radius:8px;
  background:linear-gradient(135deg,var(--primary) 0%,var(--primary-2) 100%);
  display:grid;place-items:center;flex:none;
  box-shadow:0 3px 12px var(--primary-glow);
}
.sidebar-title{font-size:0.92rem;font-weight:800;letter-spacing:-0.03em;color:var(--text)}
.sidebar-totals{display:flex;gap:7px}
.sidebar-total-chip{
  display:flex;flex-direction:column;gap:2px;padding:8px 10px;
  border-radius:var(--radius-sm);
  background:rgba(255,255,255,0.035);
  border:1px solid var(--line);flex:1;min-width:0;
  transition:background var(--transition),border-color var(--transition);
}
.sidebar-total-chip:hover{background:rgba(255,255,255,0.055);border-color:var(--line-2)}
.sidebar-total-label{font-size:0.64rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--dim)}
.sidebar-total-value{
  font-size:0.84rem;font-weight:800;color:var(--text);letter-spacing:-0.025em;
  font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.sidebar-nav{
  flex:1;overflow-y:auto;padding:9px 8px;
  display:flex;flex-direction:column;gap:1px;
}
.sidebar-nav::-webkit-scrollbar{width:3px}
.sidebar-nav::-webkit-scrollbar-track{background:transparent}
.sidebar-nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:4px}
.sidebar-nav-group{
  display:block;padding:10px 10px 3px;
  font-size:0.61rem;font-weight:700;letter-spacing:0.09em;
  text-transform:uppercase;color:var(--dim);
}
.sidebar-nav-divider{height:1px;background:var(--line);margin:6px 4px 8px}
.sidebar-footer{
  flex:none;padding:12px 14px 15px;
  border-top:1px solid var(--line);display:grid;gap:10px;
}
.sidebar-save-row{display:flex;align-items:center;gap:7px}
.sidebar-save-dot{
  width:6px;height:6px;border-radius:50%;flex:none;
  background:var(--dim);transition:background var(--transition);
}
.sidebar-save-dot.saved{background:var(--green-muted)}
.sidebar-save-dot.saving{background:var(--warning);animation:pulse-opacity 1s ease infinite}
.sidebar-save-dot.error{background:var(--danger)}
.sidebar-save-msg{font-size:0.72rem;color:var(--muted);line-height:1.4;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sidebar-user-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.sidebar-user-email{
  font-size:0.73rem;font-weight:600;color:var(--soft);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  max-width:140px;padding:4px 0;
}
.sidebar-user-actions{display:flex;gap:5px;flex-shrink:0}
/* === NAV ITEMS === */
.nav-item{
  display:flex;align-items:center;gap:9px;width:100%;
  padding:8px 10px;border-radius:var(--radius-md);text-align:left;
  color:var(--muted);background:transparent;border:1px solid transparent;
  font-size:0.84rem;font-weight:500;cursor:pointer;
  transition:all var(--transition);white-space:nowrap;overflow:hidden;
  position:relative;
}
.nav-item:hover{color:var(--soft);background:rgba(255,255,255,0.045);transform:none}
.nav-item.active{
  color:var(--text);
  background:linear-gradient(135deg,rgba(110,166,255,0.13),rgba(72,120,255,0.07));
  border-color:rgba(110,166,255,0.18);font-weight:600;
}
.nav-item.active::before{
  content:"";position:absolute;left:0;top:25%;bottom:25%;width:2.5px;
  background:var(--primary);border-radius:0 2px 2px 0;
}
.nav-item-icon{width:16px;height:16px;flex:none;opacity:0.5;transition:opacity var(--transition)}
.nav-item:hover .nav-item-icon{opacity:0.7}
.nav-item.active .nav-item-icon{opacity:1;color:var(--primary)}
.nav-item-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.nav-badge{
  margin-left:auto;font-size:0.67rem;font-weight:700;
  color:var(--dim);font-variant-numeric:tabular-nums;flex:none;
  padding:2px 6px;border-radius:999px;
  background:rgba(255,255,255,0.05);
}
.nav-item.active .nav-badge{color:var(--primary-3);background:var(--primary-bg)}
/* Onboarding sidebar */
.onboarding-sidebar{
  padding:20px 18px;gap:16px;overflow-y:auto;
  display:flex;flex-direction:column;
}
.onboarding-sidebar h1{margin:0 0 6px;font-size:1.4rem;letter-spacing:-0.035em}
/* === MAIN PANEL === */
.main-panel,.onboarding-main{min-width:0;display:grid;gap:14px;align-content:start}
/* === CARDS / PANELS === */
.hero-card,.panel,.section-block,.summary-card,.item-card,.explain-card,.budget-card{
  background:linear-gradient(160deg,rgba(14,24,40,0.86),rgba(8,15,28,0.9));
  border:1px solid var(--line);
  box-shadow:var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.035);
  backdrop-filter:blur(20px) saturate(140%);
}
.hero-card,.panel,.section-block{border-radius:var(--radius-xl)}
.hero-card{padding:24px}
.hero-card.narrow{max-width:560px}
.hero-card.small-gap{display:grid;gap:8px}
.panel{padding:22px}
.section-block{padding:18px;margin-top:10px}
.section-block > h2,.panel h2{
  margin:0 0 14px;font-size:0.93rem;font-weight:700;
  letter-spacing:-0.02em;color:var(--text);
}
.panel.page-intro h2{margin:0}
.page-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.page-intro h2{margin:0}
.page-intro-copy{display:grid;gap:8px}
/* === SECTION COMPONENT === */
.section-top{
  display:flex;align-items:flex-start;justify-content:space-between;
  gap:12px;margin-bottom:14px;
}
.section-top h2{margin:0}
.section-caption{display:block;margin-top:4px;font-size:0.78rem;color:var(--muted);line-height:1.5}
.section-body{display:grid;gap:11px}
.collapsible-section{overflow:hidden}
.section-toggle{
  list-style:none;display:flex;align-items:flex-start;justify-content:space-between;
  gap:12px;cursor:pointer;width:100%;padding:0;color:inherit;
  background:transparent;text-align:left;
}
.section-toggle::-webkit-details-marker{display:none}
.section-toggle-copy{display:grid;gap:3px}
.section-toggle-title{color:var(--text);font-size:0.93rem;font-weight:700;letter-spacing:-0.02em}
.section-toggle-summary{color:var(--muted);font-size:0.76rem}
.section-toggle::after{
  content:"+";width:24px;height:24px;display:inline-grid;place-items:center;
  border-radius:50%;color:var(--muted);background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.08);flex:none;font-size:0.85rem;
  transition:all var(--transition);
}
.collapsible-section.is-open .section-toggle{margin-bottom:14px}
.collapsible-section.is-open .section-toggle::after{content:"−";color:var(--primary);background:var(--primary-bg);border-color:var(--primary-border)}
/* === SUMMARY CARDS (MiniInfo) === */
.summary-grid{display:grid;gap:10px}
.summary-grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.summary-grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.summary-card{
  position:relative;overflow:hidden;border-radius:var(--radius-lg);padding:16px 16px 12px;
}
.summary-card::before{
  content:"";position:absolute;inset:0 auto auto 0;width:100%;height:1.5px;
  background:linear-gradient(90deg,rgba(110,166,255,0.06),rgba(110,166,255,0.8),rgba(147,197,255,0.12));
}
.summary-card::after{
  content:"";position:absolute;inset:0;border-radius:inherit;
  background:radial-gradient(ellipse at 50% -20%,rgba(110,166,255,0.06),transparent 60%);
  pointer-events:none;
}
.summary-card span,.summary-card small,.muted,.field,.chart-legend,.tiny{color:var(--muted)}
.summary-card strong{
  display:block;margin:8px 0 4px;
  font-size:clamp(1.18rem,0.95rem + 0.9vw,1.75rem);
  letter-spacing:-0.045em;color:var(--text);
  font-variant-numeric:tabular-nums;
  line-height:1.15;
}
.summary-card.mini strong{font-size:1.2rem}
.compact-bottom{margin-top:-4px}
/* === FLEX / GRID UTILITIES === */
.stack,.stack-sm,.stack-lg,.progress-list,.event-list{display:grid;gap:10px}
.stack-sm{gap:7px}
.stack-lg{gap:18px}
.row-2,.row-3,.two-up,.button-row,.item-footer,.metric-row,.panel-header,.save-strip,.wizard-footer{display:flex;gap:10px}
.row-2 > *,.two-up > *,.metric-row > *{flex:1}
.row-3 > *{flex:1}
.two-up{align-items:start}
.metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.metric-grid .metric-row{padding:0;border-bottom:none}
.wrap{flex-wrap:wrap;justify-content:space-between;align-items:flex-start}
.field{display:grid;gap:6px;font-size:0.88rem}
/* === ITEM CARDS === */
.item-card,.budget-card,.explain-card{border-radius:var(--radius-lg);padding:14px}
.item-card{display:grid;gap:10px}
.item-card.tight{gap:8px}
.item-footer,.metric-row,.save-strip,.wizard-footer,.button-row{align-items:center;justify-content:space-between}
.item-footer.no-margin{margin-bottom:8px}
.metric-row{padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
.metric-row:last-child{border-bottom:none}
.metric-row-subtle{padding-top:5px;font-size:0.82rem;border-bottom:none}
.metric-row-subtle strong{font-size:0.9rem}
/* === BUDGET TABLE === */
.budget-table-shell{
  overflow-x:auto;border-radius:var(--radius-lg);
  border:1px solid rgba(255,255,255,0.055);background:rgba(6,11,20,0.4);
}
.budget-table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0}
.budget-table th,.budget-table td{
  min-width:150px;padding:12px 14px;
  border-bottom:1px solid rgba(255,255,255,0.05);vertical-align:middle;
}
.budget-table thead th{
  position:sticky;top:0;z-index:1;text-align:left;font-size:0.82rem;font-weight:600;
  color:var(--soft);background:rgba(12,22,38,0.99);backdrop-filter:blur(20px);
  letter-spacing:0.01em;
}
.budget-table tbody tr:last-child th,.budget-table tbody tr:last-child td{border-bottom:none}
.budget-table tbody th{
  position:sticky;left:0;z-index:1;min-width:200px;text-align:left;
  font-size:0.85rem;font-weight:600;color:var(--muted);
  background:rgba(9,16,30,0.99);backdrop-filter:blur(20px);
}
.budget-table thead th:first-child{left:0;z-index:2}
.budget-table td{text-align:right;font-variant-numeric:tabular-nums}
.budget-table-month{display:grid;gap:5px}
.budget-table-value{color:var(--text);font-size:0.93rem;font-weight:700}
.budget-table-value.negative-text{color:var(--danger)}
.budget-table-value.positive-text{color:var(--green)}
/* === PILLS === */
.pill{
  display:inline-flex;align-items:center;justify-content:center;
  padding:4px 9px;border-radius:999px;font-size:0.71rem;font-weight:700;
  letter-spacing:0.01em;border:1px solid rgba(255,255,255,0.07);white-space:nowrap;
}
.pill.positive{color:var(--green);background:var(--green-bg);border-color:var(--green-border)}
.pill.warning{color:var(--warning);background:var(--warning-bg);border-color:var(--warning-border)}
.pill.neutral{color:var(--soft);background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.09)}
.pill.outline{color:var(--primary-3);background:var(--primary-bg);border-color:var(--primary-border)}
/* === BUTTONS === */
.primary-button,.secondary-button,.ghost-button{
  border-radius:var(--radius-md);padding:9px 15px;font-weight:600;font-size:0.875rem;
  letter-spacing:-0.01em;
}
.primary-button{
  color:#fff;
  background:linear-gradient(135deg,#6ea6ff 0%,#4878ff 100%);
  box-shadow:0 4px 16px rgba(72,120,255,0.3), 0 1px 3px rgba(72,120,255,0.2), inset 0 1px 0 rgba(255,255,255,0.14);
}
.primary-button:hover{
  background:linear-gradient(135deg,#7db3ff 0%,#5485ff 100%);
  box-shadow:0 6px 22px rgba(72,120,255,0.4), 0 2px 6px rgba(72,120,255,0.25), inset 0 1px 0 rgba(255,255,255,0.16);
}
.secondary-button{
  color:var(--text);
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.1);
}
.secondary-button:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.14)}
.ghost-button{
  color:var(--muted);
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.07);
}
.ghost-button:hover{color:var(--soft);background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.12)}
.ghost-button.active{color:var(--text);background:rgba(110,166,255,0.12);border-color:var(--primary-border)}
/* === TYPOGRAPHY === */
.eyebrow{
  display:inline-flex;margin-bottom:10px;padding:4px 9px;border-radius:999px;
  background:var(--primary-bg);color:var(--primary-3);
  font-size:0.68rem;font-weight:800;letter-spacing:0.09em;
  text-transform:uppercase;border:1px solid var(--primary-border);
}
.display-title{font-size:clamp(1.75rem,1.4rem + 1.3vw,2.7rem);line-height:1.06;letter-spacing:-0.05em}
.large-copy{max-width:56ch;font-size:0.95rem;line-height:1.7;color:var(--muted)}
/* === ONBOARDING STEPS === */
.progress-step{
  width:100%;display:flex;align-items:center;gap:11px;padding:10px 12px;
  border-radius:var(--radius-md);color:var(--muted);
  background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);
  text-align:left;font-size:0.85rem;transition:all var(--transition);
}
.progress-step span{
  width:26px;height:26px;border-radius:50%;display:grid;place-items:center;
  background:rgba(255,255,255,0.07);color:var(--text);font-weight:800;font-size:0.76rem;flex:none;
  transition:all var(--transition);
}
.progress-step.active{
  background:linear-gradient(135deg,rgba(110,166,255,0.12),rgba(72,120,255,0.07));
  border-color:var(--primary-border);color:var(--text);
}
.progress-step.active span,.progress-step.done span{
  background:linear-gradient(135deg,var(--primary) 0%,var(--primary-2) 100%);
  box-shadow:0 2px 8px rgba(72,120,255,0.35);
}
/* kept for onboarding sidebar fallback */
.tab-list{display:grid;gap:7px}
.tab-button{
  width:100%;padding:10px 12px;border-radius:var(--radius-md);text-align:left;
  color:var(--soft);background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.055);
  transition:all var(--transition);
}
.tab-button strong{display:block;margin-bottom:3px;color:var(--text)}
.tab-button span{display:block;font-size:0.75rem;line-height:1.4;color:var(--muted)}
.tab-button.active{
  background:linear-gradient(135deg,rgba(110,166,255,0.15),rgba(72,120,255,0.08));
  border-color:var(--primary-border);box-shadow:0 6px 20px rgba(30,56,110,0.16);
}
/* === CALENDAR === */
.event-list{max-height:420px;overflow:auto}
.calendar-stack{display:grid;gap:14px}
.calendar-legend{display:flex;flex-wrap:wrap;gap:7px}
.calendar-legend-item{
  display:inline-flex;align-items:center;gap:7px;padding:4px 9px;border-radius:999px;
  background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.06);
  font-size:0.73rem;color:var(--soft);
}
.calendar-legend-dot,.calendar-marker-dot{width:7px;height:7px;border-radius:999px;flex:none}
.calendar-month{
  display:grid;gap:11px;padding:14px;border-radius:var(--radius-lg);
  background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.048);
}
.calendar-month-header{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.calendar-nav{display:flex;align-items:center;gap:7px}
.calendar-nav-status{min-width:80px;text-align:center;color:var(--muted);font-size:0.74rem;font-weight:700}
.calendar-month-header h3{margin:0;font-size:0.97rem;font-weight:700;letter-spacing:-0.02em}
.calendar-weekdays,.calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
.calendar-weekdays{color:var(--dim);font-size:0.71rem;text-transform:uppercase;letter-spacing:0.07em}
.calendar-weekdays span{padding:0 4px}
.calendar-day-spacer,.calendar-day{min-height:96px;border-radius:14px}
.calendar-day-spacer{background:rgba(255,255,255,0.012);border:1px dashed rgba(255,255,255,0.03)}
.calendar-day{
  display:grid;align-content:start;gap:7px;padding:9px;text-align:left;color:inherit;
  background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.048);
  transition:border-color var(--transition);
}
.calendar-day:hover{border-color:rgba(110,166,255,0.3);background:rgba(110,166,255,0.05)}
.calendar-day.selected{
  background:linear-gradient(160deg,rgba(24,42,72,0.9),rgba(12,22,38,0.95));
  border-color:rgba(110,166,255,0.42);box-shadow:0 8px 24px rgba(20,38,76,0.2);
}
.calendar-day.is-empty{opacity:.45}
.calendar-day-top{display:flex;align-items:center;justify-content:space-between;gap:6px}
.calendar-day-number{font-size:0.92rem;font-weight:700;color:var(--text)}
.calendar-day-count{font-size:0.7rem;color:var(--muted)}
.calendar-marker-row{display:flex;flex-wrap:wrap;gap:4px}
.calendar-marker{
  display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:999px;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.055);
  font-size:0.68rem;color:var(--soft);white-space:nowrap;
}
.calendar-day-preview{color:var(--muted);font-size:0.71rem;line-height:1.35}
.calendar-day-preview strong{color:var(--text)}
.calendar-detail{
  display:grid;gap:9px;padding:12px;border-radius:14px;
  background:rgba(6,11,22,0.55);border:1px solid rgba(255,255,255,0.052);
}
.calendar-detail-header{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.calendar-detail-header h4{margin:0;font-size:0.92rem;font-weight:700}
.calendar-detail-list{display:grid;gap:7px}
.calendar-detail-event{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;
  padding:9px 11px;border-radius:12px;
  background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.045);
}
.calendar-detail-main,.calendar-detail-side{display:grid;gap:4px}
.calendar-detail-side{justify-items:end}
.calendar-kind-income .calendar-legend-dot,.calendar-kind-income .calendar-marker-dot{background:var(--green)}
.calendar-kind-expense .calendar-legend-dot,.calendar-kind-expense .calendar-marker-dot{background:var(--danger)}
.calendar-kind-card-payment .calendar-legend-dot,.calendar-kind-card-payment .calendar-marker-dot{background:var(--warning)}
.calendar-kind-investment .calendar-legend-dot,.calendar-kind-investment .calendar-marker-dot{background:var(--primary-3)}
.event-row{
  display:grid;grid-template-columns:minmax(0,1.5fr) auto;gap:12px;align-items:center;
  padding:11px 13px;border-radius:var(--radius-md);
  background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.045);
  transition:border-color var(--transition),background var(--transition);
}
.event-row:hover{border-color:rgba(255,255,255,0.07);background:rgba(255,255,255,0.035)}
.event-main,.event-side{display:grid;gap:4px}
.event-meta-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.event-side{justify-items:end}
/* === FORM HELPERS === */
.input-hint{margin-top:1px;font-size:0.74rem;color:var(--dim);line-height:1.45}
.section-note{font-size:0.82rem;line-height:1.55;color:var(--muted)}
.amount{font-variant-numeric:tabular-nums;font-weight:800}
.positive-text{color:var(--green)}
.negative-text{color:var(--danger)}
/* === CHART === */
.chart-wrap{display:grid;gap:10px}
.chart-account-legend{display:flex;flex-wrap:wrap;gap:7px}
.chart-account-chip{
  display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:999px;
  background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.06);
  font-size:0.73rem;color:var(--soft);
  transition:all var(--transition);cursor:default;
}
.chart-account-chip:hover{background:rgba(255,255,255,0.055);border-color:rgba(255,255,255,0.1)}
.chart-account-swatch{width:8px;height:8px;border-radius:50%;flex:none}
.chart{width:100%;height:auto}
.chart-bg{fill:rgba(255,255,255,0.018);stroke:rgba(255,255,255,0.04)}
.chart-grid-line{stroke:rgba(255,255,255,0.06);stroke-dasharray:4 6}
.chart-axis-line{stroke:rgba(255,255,255,0.14)}
.chart-axis-label{fill:var(--dim);font-size:10px;font-weight:600;letter-spacing:0.02em}
.chart-axis-title{fill:var(--muted);font-size:10.5px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase}
.zero-line{stroke:rgba(255,255,255,0.07);stroke-dasharray:5 6}
.reserve-line{stroke:rgba(245,184,74,0.85);stroke-dasharray:8 7}
.balance-line{stroke:url(#balanceLineGradient);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 4px 10px rgba(72,120,255,0.3))}
.chart-account-line{fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:6 5;opacity:.65}
.chart-account-line.hovered{opacity:1;stroke-width:2.2}
.chart-dot{fill:var(--primary-3)}
.chart-area{fill:url(#balanceAreaGradient);opacity:.22}
.chart-band-safe{fill:rgba(45,212,191,0.04)}
.chart-band-caution{fill:rgba(250,204,21,0.04)}
.chart-band-danger{fill:rgba(255,90,90,0.06)}
.chart-marker-income{fill:var(--green)}
.chart-marker-expense{fill:var(--danger)}
.chart-marker-card-payment{fill:var(--warning)}
.chart-marker-investment{fill:var(--primary-3)}
.chart-event-point{stroke:rgba(5,10,22,0.9);stroke-width:2;transition:transform 110ms ease,opacity 110ms ease}
.chart-event-point.account-risk{stroke:var(--danger);stroke-width:3}
.chart-event-point:hover{opacity:1}
.chart-annotation-line{stroke:rgba(255,255,255,0.1);stroke-dasharray:4 6}
.chart-annotation-label{fill:rgba(8,14,26,0.96);stroke:rgba(255,255,255,0.08)}
.chart-annotation-text{fill:var(--text);font-size:10px;font-weight:700}
.chart-hover-line{stroke:rgba(110,166,255,0.38);stroke-dasharray:5 6}
.chart-hover-dot{fill:#eef2ff;stroke:rgba(110,166,255,0.9);stroke-width:2.5}
.chart-tooltip-box{fill:rgba(6,12,24,0.97);stroke:rgba(110,166,255,0.28)}
.chart-tooltip-date{fill:var(--muted);font-size:10px;font-weight:700}
.chart-tooltip-value{fill:var(--text);font-size:13px;font-weight:800;letter-spacing:-0.02em}
.chart-tooltip-label{fill:var(--soft);font-size:11px;font-weight:600}
/* === RANGE SLIDER === */
.slider-grid{display:grid;gap:12px}
.slider-card{
  border-radius:var(--radius-lg);padding:14px;
  background:linear-gradient(160deg,rgba(12,22,38,0.8),rgba(8,15,28,0.9));
  border:1px solid rgba(255,255,255,0.065);
}
.slider-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px}
.slider-head strong{display:block;margin-bottom:2px;font-size:0.86rem}
.slider-value{font-weight:800;color:var(--text);font-variant-numeric:tabular-nums;font-size:0.9rem}
input[type=range].annotated-range{padding:0;height:24px;background:transparent;border:none;box-shadow:none;appearance:none}
input[type=range].annotated-range:focus{box-shadow:none}
input[type=range].annotated-range::-webkit-slider-runnable-track{height:6px;border-radius:999px;background:linear-gradient(90deg,rgba(110,166,255,0.25),rgba(110,166,255,0.75))}
input[type=range].annotated-range::-webkit-slider-thumb{appearance:none;width:18px;height:18px;margin-top:-6px;border-radius:50%;background:white;box-shadow:0 0 0 3px rgba(110,166,255,0.25),0 4px 12px rgba(0,0,0,0.35);transition:box-shadow var(--transition)}
input[type=range].annotated-range::-webkit-slider-thumb:hover{box-shadow:0 0 0 4px rgba(110,166,255,0.35),0 6px 16px rgba(0,0,0,0.38)}
input[type=range].annotated-range::-moz-range-track{height:6px;border-radius:999px;background:linear-gradient(90deg,rgba(110,166,255,0.25),rgba(110,166,255,0.75))}
input[type=range].annotated-range::-moz-range-thumb{width:18px;height:18px;border:none;border-radius:50%;background:white;box-shadow:0 0 0 3px rgba(110,166,255,0.25),0 4px 12px rgba(0,0,0,0.35)}
.slider-scale,.slider-hints{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:5px;font-size:0.70rem;color:var(--dim)}
.slider-scale span:nth-child(2),.slider-hints span:nth-child(2){text-align:center}
.slider-scale span:last-child,.slider-hints span:last-child{text-align:right}
/* === WIZARD === */
.onboarding-fields{padding-top:8px}
.wizard-footer{margin-top:20px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.065)}
/* === UTILS === */
.no-bottom{margin-bottom:0}
/* === PANEL HEADER OVERRIDE === */
.panel-header.wrap h2{margin-bottom:0}
/* === RESPONSIVE === */
@media(max-width:1200px){
  .summary-grid-4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .summary-grid-3,.two-up,.metric-grid{grid-template-columns:1fr;display:grid}
}
@media(max-width:960px){
  .app-shell,.onboarding-shell{grid-template-columns:1fr}
  .sidebar,.onboarding-sidebar{position:static;height:auto;max-height:none}
  .sidebar{flex-direction:column}
}
@media(max-width:720px){
  .app-shell,.onboarding-shell{padding:12px;gap:12px}
  .panel,.hero-card,.section-block{padding:16px;border-radius:var(--radius-lg)}
  .summary-grid-4,.summary-grid-3,.row-2,.row-3,.metric-grid{grid-template-columns:1fr;display:grid}
  .event-row{grid-template-columns:1fr}
  .event-side{justify-items:start}
  .calendar-month-header,.calendar-detail-header,.calendar-detail-event{display:grid;grid-template-columns:1fr}
  .calendar-weekdays,.calendar-grid{gap:5px}
  .calendar-day-spacer,.calendar-day{min-height:80px}
  .calendar-marker{padding:3px 6px;font-size:0.64rem}
  .wizard-footer,.item-footer,.panel-header,.save-strip{flex-direction:column;align-items:stretch}
  .page-intro{flex-direction:column}
}
/* === CHART CONTROLS === */
.chart-controls{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.timescale-group{display:flex;align-items:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:var(--radius-sm);padding:3px;gap:2px}
.timescale-btn{
  padding:3px 9px;border-radius:calc(var(--radius-sm) - 3px);
  font-size:0.73rem;font-weight:700;letter-spacing:0.01em;
  color:var(--dim);background:transparent;border:none;cursor:pointer;
  transition:all var(--transition);
}
.timescale-btn:hover{color:var(--soft);background:rgba(255,255,255,0.08);transform:none}
.timescale-btn.active{color:var(--primary-3);background:linear-gradient(135deg,rgba(110,166,255,0.2),rgba(72,120,255,0.12));box-shadow:inset 0 0 0 1px rgba(110,166,255,0.25)}
/* === CHART BOTTOM === */
.chart-bottom{display:grid;gap:10px;margin-top:10px}
.chart-legend-row{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}
.chart-legend-item,.chart-legend-toggle{display:inline-flex;align-items:center;gap:5px;font-size:0.72rem;color:var(--muted);white-space:nowrap}
.chart-legend-toggle{
  border:1px solid transparent;background:transparent;border-radius:var(--radius-xs);
  padding:3px 6px;cursor:pointer;font:inherit;transition:background var(--transition),border-color var(--transition),color var(--transition),opacity var(--transition);
}
.chart-legend-toggle:hover{background:rgba(255,255,255,0.045);color:var(--soft)}
.chart-legend-toggle.active{background:rgba(110,166,255,0.09);border-color:rgba(110,166,255,0.18);color:var(--text)}
.chart-legend-toggle:not(.active){opacity:0.58}
.chart-legend-line{width:18px;height:3px;border-radius:999px;flex:none}
.chart-hover-card{
  display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;
  padding:9px 13px;border-radius:var(--radius-md);
  background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.055);
  font-size:0.74rem;color:var(--muted);font-variant-numeric:tabular-nums;
}
.chart-hover-card-item{display:flex;align-items:center;gap:5px}
.chart-hover-card-item strong{color:var(--text);font-weight:700;font-variant-numeric:tabular-nums}
`;

function AppStyles() {
  return <style>{APP_STYLES}</style>;
}

function AuthScreen({ statusMessage, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === 'register';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await fetch(`/api/auth/${isSignup ? 'register' : 'login'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);

    const result = response ? await response.json().catch(() => ({})) : {};
    setIsSubmitting(false);

    if (!response?.ok) {
      setError(result.error || 'Could not sign in. Try again.');
      return;
    }

    await onAuthenticated(result.user);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card-brand">
          <div className="auth-card-icon">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1,12 5,7 9,10 15,2"/>
            </svg>
          </div>
          <span className="auth-card-name">BalTrack</span>
        </div>
        <div>
          <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p style={{ marginTop: '8px', color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.65 }}>
            {isSignup
              ? 'Your plan is stored securely in the cloud and syncs across all your devices.'
              : 'Sign in to view and update your balance and net worth projections.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <Label>
            Email address
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Label>
          <Label hint={isSignup ? 'Minimum 12 characters.' : ''}>
            Password
            <input
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={isSignup ? 'Create a strong password' : '••••••••••••'}
              minLength={isSignup ? 12 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Label>
          {error ? (
            <div className="auth-error">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <circle cx="8" cy="8" r="7"/><line x1="8" y1="5" x2="8" y2="8"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/>
              </svg>
              {error}
            </div>
          ) : null}

          <button className="primary-button" type="submit" disabled={isSubmitting} style={{marginTop:'2px'}}>
            {isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="auth-switch">
          <span style={{ fontSize: '0.73rem', color: 'var(--dim)' }}>{statusMessage}</span>
          <button
            className="ghost-button"
            type="button"
            style={{ fontSize: '0.82rem', padding: '6px 11px' }}
            onClick={() => {
              setError('');
              setMode(isSignup ? 'login' : 'register');
            }}
          >
            {isSignup ? 'Sign in instead' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BalancePlanner() {
  const [form, setForm] = useState(createEmptyPlan);
  const [saveMessage, setSaveMessage] = useState('Opening balance tracker...');
  const [storageLabel, setStorageLabel] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [onboardingStartStep, setOnboardingStartStep] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSession() {
      const session = await fetchSession();
      if (!isMounted) return;

      if (!session.ok) {
        setSaveMessage(session.message || 'Cloud database is not ready yet.');
        setIsHydrated(true);
        return;
      }

      if (!session.user) {
        setSaveMessage('Sign in to sync your plan across devices.');
        setIsHydrated(true);
        return;
      }

      await loadPlanForUser(session.user);
      if (!isMounted) return;
      setIsHydrated(true);
    }

    loadInitialSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadPlanForUser = async (user) => {
    setAuthUser(user);
    setSaveMessage('Opening your cloud plan...');

    const result = await loadStoredPlan();
    if (result?.unauthorized) {
      setAuthUser(null);
      setSaveMessage('Sign in to sync your plan across devices.');
      return;
    }

    if (!result?.ok) {
      setStorageLabel('');
      setForm(createEmptyPlan());
      setNeedsOnboarding(true);
      setSaveMessage(result?.message || 'Cloud storage is not available.');
      return;
    }

    setStorageLabel(result?.storageLabel || '');
    if (result.data) {
      const onboardingProgress = getOnboardingProgress(result.data);
      setForm(normalizePlan(result.data));
      if (onboardingProgress && !onboardingProgress.complete) {
        setOnboardingStartStep(onboardingProgress.stepIndex);
        setNeedsOnboarding(true);
        setSaveMessage(`Resumed onboarding progress${result.storageLabel ? ` · ${result.storageLabel}` : ''}`);
        return;
      }

      setOnboardingStartStep(0);
      setNeedsOnboarding(false);
      setSaveMessage(`Loaded your plan${result.storageLabel ? ` · ${result.storageLabel}` : ''}`);
      return;
    }

    const legacyPlan = loadLegacyBrowserPlan();
    if (legacyPlan.data) {
      const normalizedLegacyPlan = normalizePlan(legacyPlan.data);
      const migrated = await saveStoredPlan(normalizedLegacyPlan);
      if (migrated?.ok) {
        removeLegacyBrowserPlan();
        setForm(normalizedLegacyPlan);
        setStorageLabel(migrated.storageLabel || result.storageLabel || '');
        setNeedsOnboarding(false);
        setSaveMessage('Migrated this browser plan into your cloud account.');
        return;
      }
    }

    setForm(createEmptyPlan());
    setOnboardingStartStep(0);
    setNeedsOnboarding(true);
    setSaveMessage('No plan found yet. Start onboarding to save your real data.');
  };

  useEffect(() => {
    if (!isHydrated || needsOnboarding || !authUser) return;

    const timeoutId = window.setTimeout(async () => {
      const result = await saveStoredPlan(form);
      if (result?.ok) {
        setStorageLabel(result.storageLabel || '');
        setSaveMessage(`Auto-saved · ${formatClockTime(result.savedAt)}`);
      } else if (result?.unauthorized) {
        setAuthUser(null);
        setSaveMessage('Sign in again to continue syncing.');
      } else {
        setSaveMessage(result?.message || 'Could not save your plan.');
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [form, isHydrated, needsOnboarding, authUser]);

  const projection = useMemo(() => buildProjection(form), [form]);

  const saveOnboardingProgress = useCallback(async (draft, stepIndex) => {
    const normalized = normalizePlan(draft);
    const result = await saveStoredPlan(withOnboardingProgress(normalized, stepIndex));
    if (result?.ok) {
      setForm(normalized);
      setStorageLabel(result.storageLabel || '');
      setSaveMessage(`Onboarding saved · ${formatClockTime(result.savedAt)}`);
      return result;
    }

    if (result?.unauthorized) {
      setAuthUser(null);
      setSaveMessage('Sign in again to continue syncing.');
      return result;
    }

    setSaveMessage(result?.message || 'Could not save onboarding progress.');
    return result;
  }, []);

  const finishOnboarding = async (nextPlan) => {
    const normalized = normalizePlan({ ...withoutOnboardingProgress(nextPlan), startDate: todayISO() });
    const result = await saveStoredPlan(normalized);
    if (!result?.ok) {
      setSaveMessage(result?.message || 'Could not save your plan.');
      return false;
    }

    setForm(normalized);
    setStorageLabel(result.storageLabel || '');
    setSaveMessage('Plan saved to your cloud account. Welcome in.');
    setNeedsOnboarding(false);
    return true;
  };

  const startOver = async () => {
    await resetStoredPlan();
    setForm(createEmptyPlan());
    setOnboardingStartStep(0);
    setNeedsOnboarding(true);
    setSaveMessage('Cleared saved plan. Start onboarding again.');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    setAuthUser(null);
    setForm(createEmptyPlan());
    setStorageLabel('');
    setNeedsOnboarding(false);
    setSaveMessage('Signed out.');
  };

  if (!isHydrated) {
    return (
      <>
        <AppStyles />
        <div className="loading-screen">
          <div className="loading-card">
            <div className="loading-card-brand">
              <div className="loading-card-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1,12 5,7 9,10 15,2"/>
                </svg>
              </div>
              <span className="loading-card-name">BalTrack</span>
            </div>
            <div className="spinner" />
            <p>Loading your plan…</p>
          </div>
        </div>
      </>
    );
  }

  if (!authUser) {
    return (
      <>
        <AppStyles />
        <AuthScreen
          statusMessage={saveMessage}
          onAuthenticated={async (user) => {
            setIsHydrated(false);
            await loadPlanForUser(user);
            setIsHydrated(true);
          }}
        />
      </>
    );
  }

  if (needsOnboarding) {
    return (
      <>
        <AppStyles />
      <OnboardingFlow
        initialPlan={form}
        initialStepIndex={onboardingStartStep}
        onSaveProgress={saveOnboardingProgress}
        onComplete={finishOnboarding}
        dbPath={storageLabel}
        statusMessage={saveMessage}
        userEmail={authUser.email}
        onLogout={logout}
      />
      </>
    );
  }

  return (
    <>
      <AppStyles />
    <PlannerView
      form={form}
      setForm={setForm}
      projection={projection}
      storageLabel={storageLabel}
      saveMessage={saveMessage}
      userEmail={authUser.email}
      onLogout={logout}
      onStartOver={startOver}
    />
    </>
  );
}

function PlannerView({
  form,
  setForm,
  projection,
  storageLabel,
  saveMessage,
  userEmail,
  onLogout,
  onStartOver,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const plannerTabs = [
    {
      id: 'overview',
      label: 'Overview',
      description: 'Timeline, account risk markers, and the monthly budget snapshot.',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Reserve line and flex-budget guardrails.',
    },
    {
      id: 'monthly-plan',
      label: 'Monthly plan',
      description: Object.keys(normalizeMonthlyOverrides(form.monthlyOverrides)).length
        ? `${Object.keys(normalizeMonthlyOverrides(form.monthlyOverrides)).length} month pattern${Object.keys(normalizeMonthlyOverrides(form.monthlyOverrides)).length === 1 ? '' : 's'} saved.`
        : 'Set month-of-year budget and investing patterns without altering the shared defaults.',
    },
    {
      id: 'accounts',
      label: 'Accounts',
      description: `${getCashAccounts(form.accounts).length} cash · ${getInvestmentAccounts(form.accounts).length} investment tracked.`,
    },
    {
      id: 'income',
      label: 'Income',
      description: `${currency.format(getResolvedIncomeYearSettings(form.incomeModel, parseLocalDate(form.startDate).getFullYear()).baseSalary)} salary simulator with year-based overrides.`,
    },
    {
      id: 'bills',
      label: 'Bills',
      description: `${form.recurringExpenses.length} direct bank withdrawal${form.recurringExpenses.length === 1 ? '' : 's'} scheduled.`,
    },
    {
      id: 'investing',
      label: 'Investing',
      description: normalizeInvestmentModel(form.investmentModel, form.accounts, form).recurringAmount > 0
        ? `${currency.format(normalizeInvestmentModel(form.investmentModel, form.accounts, form).recurringAmount)} on day ${normalizeInvestmentModel(form.investmentModel, form.accounts, form).recurringDayOfMonth} each month.`
        : 'Set a recurring monthly investment date and amount.',
    },
    {
      id: 'cards',
      label: 'Cards',
      description: `${form.creditCards.length} credit card${form.creditCards.length === 1 ? '' : 's'} modeled.`,
    },
  ];
  const activeTabConfig = plannerTabs.find((tab) => tab.id === activeTab) ?? plannerTabs[0];

  const addAccount = () =>
    setForm((current) => ({
      ...current,
      accounts: [...current.accounts, createAccount(`Cash account ${current.accounts.length + 1}`)],
    }));
  const updateAccount = (id, patch) =>
    setForm((current) => ({
      ...current,
      accounts: current.accounts.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  const removeAccount = (id) =>
    setForm((current) => removeAccountFromPlan(current, id));

  const addExpense = () =>
    setForm((current) => ({
      ...current,
      recurringExpenses: [...current.recurringExpenses, createExpense(getPrimaryAccountId(current.accounts))],
    }));
  const updateExpense = (id, patch) =>
    setForm((current) => ({
      ...current,
      recurringExpenses: current.recurringExpenses.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  const removeExpense = (id) =>
    setForm((current) => ({
      ...current,
      recurringExpenses: current.recurringExpenses.filter((item) => item.id !== id),
    }));

  const overrideCount = Object.keys(normalizeMonthlyOverrides(form.monthlyOverrides)).length;
  const investmentModel = normalizeInvestmentModel(form.investmentModel, form.accounts, form);

  const NAV_ICONS = {
    overview: <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,13 5.5,8 9,11 16,3"/><line x1="1" y1="16" x2="16" y2="16"/></svg>,
    settings: <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="5" x2="5" y2="5"/><circle cx="7" cy="5" r="2"/><line x1="9" y1="5" x2="16" y2="5"/><line x1="1" y1="12" x2="10" y2="12"/><circle cx="12" cy="12" r="2"/><line x1="14" y1="12" x2="16" y2="12"/></svg>,
    'monthly-plan': <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><line x1="1" y1="7" x2="16" y2="7"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="5" y1="11" x2="5" y2="11" strokeWidth="2.5"/><line x1="8.5" y1="11" x2="8.5" y2="11" strokeWidth="2.5"/><line x1="12" y1="11" x2="12" y2="11" strokeWidth="2.5"/></svg>,
    accounts: <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="15" height="10" rx="2"/><path d="M1 8h15"/><path d="M4 5V3a1 1 0 011-1h7a1 1 0 011 1v2"/><circle cx="4.5" cy="11.5" r="1" fill="currentColor" stroke="none"/></svg>,
    income: <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8.5" cy="8.5" r="7.5"/><path d="M8.5 5v7M6 6.5c0-.8.7-1.5 2.5-1.5s2.5.7 2.5 1.5-1 1.5-2.5 1.5-2.5.7-2.5 1.5 1 1.5 2.5 1.5 2.5-.7 2.5-1.5"/></svg>,
    bills: <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 1h11v15l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5V1"/><line x1="5.5" y1="6" x2="11.5" y2="6"/><line x1="5.5" y1="9" x2="11.5" y2="9"/><line x1="5.5" y1="12" x2="9" y2="12"/></svg>,
    investing: <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,14 6,8 10,11 16,3"/><polyline points="12,3 16,3 16,7"/></svg>,
    cards: <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3.5" width="15" height="10" rx="2"/><line x1="1" y1="7.5" x2="16" y2="7.5"/><line x1="4" y1="11" x2="7" y2="11"/><line x1="10" y1="11" x2="13" y2="11"/></svg>,
  };

  const tabBadges = {
    overview: '',
    settings: '',
    'monthly-plan': overrideCount ? `${overrideCount}` : '',
    accounts: `${form.accounts.length}`,
    income: '',
    bills: form.recurringExpenses.length ? `${form.recurringExpenses.length}` : '',
    investing: investmentModel.recurringAmount > 0 ? currency.format(investmentModel.recurringAmount).replace(/\.00$/, '') : '',
    cards: form.creditCards.length ? `${form.creditCards.length}` : '',
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1,12 5,7 9,10 15,2"/>
              </svg>
            </div>
            <span className="sidebar-title">BalTrack</span>
          </div>
          <div className="sidebar-totals">
            <div className="sidebar-total-chip">
              <span className="sidebar-total-label">Cash</span>
              <span className="sidebar-total-value">{currency.format(totalCash(form.accounts))}</span>
            </div>
            <div className="sidebar-total-chip">
              <span className="sidebar-total-label">Invested</span>
              <span className="sidebar-total-value">{currency.format(totalInvestments(form.accounts))}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {plannerTabs.map((tab) => {
            const groupLabel = tab.id === 'accounts' ? 'Cash Flow'
              : tab.id === 'investing' ? 'Investing'
              : null;
            const showDivider = tab.id === 'settings';
            return (
              <React.Fragment key={tab.id}>
                {groupLabel ? (
                  <span className="sidebar-nav-group">{groupLabel}</span>
                ) : null}
                {showDivider ? (
                  <div className="sidebar-nav-divider" />
                ) : null}
                <button
                  type="button"
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="nav-item-icon">{NAV_ICONS[tab.id]}</span>
                  <span className="nav-item-label">{tab.label}</span>
                  {tabBadges[tab.id] ? <span className="nav-badge">{tabBadges[tab.id]}</span> : null}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-save-row">
            <span className={`sidebar-save-dot ${saveMessage.startsWith('Auto-saved') || saveMessage.startsWith('Loaded') ? 'saved' : saveMessage.includes('saving') || saveMessage.includes('Opening') ? 'saving' : saveMessage.includes('not') || saveMessage.includes('Could not') ? 'error' : ''}`} />
            <span className="sidebar-save-msg">{saveMessage}</span>
          </div>
          <div className="sidebar-user-row">
            <span className="sidebar-user-email" title={userEmail}>{userEmail}</span>
            <div className="sidebar-user-actions">
              <button className="ghost-button" style={{padding:'5px 9px',fontSize:'0.76rem'}} onClick={onStartOver}>Reset</button>
              <button className="ghost-button" style={{padding:'5px 9px',fontSize:'0.76rem'}} type="button" onClick={onLogout}>Sign out</button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        {activeTab === 'overview' ? (
          <OverviewPage
            form={form}
            setForm={setForm}
            projection={projection}
          />
        ) : null}

        {activeTab === 'settings' ? <SettingsPage form={form} setForm={setForm} /> : null}

        {activeTab === 'monthly-plan' ? <MonthlyPlanPage form={form} setForm={setForm} projection={projection} /> : null}

        {activeTab === 'accounts' ? (
          <AccountsPage form={form} onAdd={addAccount} onChange={updateAccount} onDelete={removeAccount} />
        ) : null}

        {activeTab === 'income' ? <IncomePage form={form} setForm={setForm} /> : null}

        {activeTab === 'bills' ? (
          <BillsPage form={form} onAdd={addExpense} onChange={updateExpense} onDelete={removeExpense} />
        ) : null}

        {activeTab === 'investing' ? <InvestingPage form={form} setForm={setForm} projection={projection} /> : null}

        {activeTab === 'cards' ? <CardsPage form={form} setForm={setForm} /> : null}
      </main>
    </div>
  );
}

function LowestBalanceAlert({ projection, reserveTarget }) {
  const { lowestAccount } = projection;
  if (!lowestAccount || !lowestAccount.name || lowestAccount.name === '—') return null;

  const isBreach = lowestAccount.minimumBalance < reserveTarget;
  const isNegative = lowestAccount.minimumBalance < 0;
  const isHealthy = !isBreach && reserveTarget > 0;

  const bgColor = isNegative ? 'var(--danger-bg)' : isBreach ? 'var(--warning-bg)' : 'var(--green-bg)';
  const borderColor = isNegative ? 'var(--danger-border)' : isBreach ? 'var(--warning-border)' : 'var(--green-border)';
  const textColor = isNegative ? 'var(--danger)' : isBreach ? 'var(--warning)' : 'var(--green)';
  const headline = isNegative
    ? `${lowestAccount.name} goes negative`
    : isBreach
      ? `${lowestAccount.name} drops below your ${currency.format(reserveTarget)} reserve`
      : reserveTarget > 0
        ? `All accounts stay above your ${currency.format(reserveTarget)} reserve target`
        : `Lowest projected balance in ${lowestAccount.name}`;

  const AlertIcon = isNegative
    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2L1 14h14L8 2z"/><line x1="8" y1="7" x2="8" y2="10"/><circle cx="8" cy="12.5" r="0.5" fill="currentColor"/></svg>
    : isBreach
      ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="7"/><line x1="8" y1="5" x2="8" y2="8"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
      : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="7"/><polyline points="5,8.5 7,10.5 11,6"/></svg>;

  return (
    <div style={{
      padding: '14px 18px', borderRadius: 'var(--radius-lg)',
      border: `1px solid ${borderColor}`, background: bgColor,
      display: 'flex', alignItems: 'center', gap: '14px',
      backdropFilter: 'blur(12px)',
    }}>
      <span style={{ color: textColor, flexShrink: 0, display: 'flex' }}>{AlertIcon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: textColor }}>{headline}</div>
        <div style={{ fontSize: '0.76rem', marginTop: '2px', color: 'var(--muted)' }}>
          {lowestAccount.name} hits {currency.format(lowestAccount.minimumBalance)}
          {lowestAccount.minimumDate ? ` on ${formatDate(lowestAccount.minimumDate)}` : ''}
          {isHealthy ? ' — within your reserve target' : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: textColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>{currency.format(lowestAccount.minimumBalance)}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '1px' }}>floor</div>
      </div>
    </div>
  );
}

const CHART_WINDOW_OPTIONS = [
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: '1y', label: '1Y' },
  { key: '2y', label: '2Y' },
  { key: 'all', label: 'All' },
];

function OverviewPage({ form, setForm, projection }) {
  const effectiveReserveTarget = Math.max(0, form.cashReserveTarget);
  const [chartMode, setChartMode] = useState('cash');
  const [chartWindow, setChartWindow] = useState('all');
  const fullTimeline = chartMode === 'net-worth' ? projection.netWorthTimeline : projection.cashTimeline;
  const fullOverlays = chartMode === 'net-worth' ? projection.netWorthOverlayTimelines : projection.accountTimelines;
  const projectionMonths = (form.projectionYears || 1) * 12;
  const visibleWindows = CHART_WINDOW_OPTIONS.filter((w) => w.key === 'all' || (CHART_WINDOW_MONTHS[w.key] || 0) < projectionMonths);

  const { activeTimeline, activeEvents, activeOverlays } = useMemo(() => {
    const months = CHART_WINDOW_MONTHS[chartWindow];
    if (!months || !fullTimeline.length) {
      return { activeTimeline: fullTimeline, activeEvents: projection.events, activeOverlays: fullOverlays };
    }
    const cutoff = addMonths(fullTimeline[0].date, months);
    const tl = fullTimeline.filter((p) => p.date <= cutoff);
    const ev = projection.events.filter((e) => e.date <= cutoff);
    const ov = fullOverlays.map((acc) => ({ ...acc, points: acc.points.filter((p) => p.date <= cutoff) }));
    return { activeTimeline: tl, activeEvents: ev, activeOverlays: ov };
  }, [chartWindow, fullTimeline, fullOverlays, projection.events]);

  return (
    <>
      <LowestBalanceAlert projection={projection} reserveTarget={effectiveReserveTarget} />
      <section className="panel">
        <div className="chart-controls">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ marginBottom: '4px' }}>{chartMode === 'net-worth' ? 'Projected net worth' : 'Projected cash balance'}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5, maxWidth: '55ch' }}>
              {chartMode === 'net-worth'
                ? 'Cash + investments, including 401(k) contributions, employer match, and your annual return assumption.'
                : 'Daily total after take-home pay, bank withdrawals, card due dates, and brokerage contributions.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div style={{ width: 130 }}>
              <Label>
                Years shown
                <NumericInput
                  value={form.projectionYears}
                  integer
                  sanitize={clampProjectionYears}
                  onValueChange={(next) => setForm((current) => ({ ...current, projectionYears: next, months: Math.max(1, next * 12) }))}
                />
              </Label>
            </div>
            {visibleWindows.length > 1 ? (
              <div className="timescale-group">
                {visibleWindows.map((w) => (
                  <button key={w.key} className={`timescale-btn ${chartWindow === w.key ? 'active' : ''}`} onClick={() => setChartWindow(w.key)}>
                    {w.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', padding: '3px', gap: '2px' }}>
              <button className={`ghost-button ${chartMode === 'cash' ? 'active' : ''}`} style={{ padding: '5px 12px', fontSize: '0.8rem', border: 'none', borderRadius: 'calc(var(--radius-md) - 3px)' }} onClick={() => setChartMode('cash')}>Cash</button>
              <button className={`ghost-button ${chartMode === 'net-worth' ? 'active' : ''}`} style={{ padding: '5px 12px', fontSize: '0.8rem', border: 'none', borderRadius: 'calc(var(--radius-md) - 3px)' }} onClick={() => setChartMode('net-worth')}>Net worth</button>
            </div>
            {chartMode === 'cash'
              ? <div className="pill neutral" style={{ fontSize: '0.72rem' }}>Reserve {currency.format(effectiveReserveTarget)}</div>
              : <div className="pill positive" style={{ fontSize: '0.72rem' }}>End {currency.format(projection.endingNetWorth)}</div>}
          </div>
        </div>
        <BalanceChart
          timeline={activeTimeline}
          reserveTarget={chartMode === 'cash' ? effectiveReserveTarget : 0}
          events={activeEvents}
          accountTimelines={activeOverlays}
          chartLabel={chartMode === 'net-worth' ? 'Net worth' : 'Balance'}
          showReserve={chartMode === 'cash'}
        />
      </section>

      <section className="panel">
        <h2>Monthly budget snapshot</h2>
        <MonthlyBudgetList summaries={projection.monthlySummaries} />
      </section>

      <section className="panel">
        <h2>Upcoming events</h2>
        <EventList
          events={projection.events}
          rangeStart={projection.timeline[0]?.date}
          rangeEnd={projection.timeline.at(-1)?.date}
        />
      </section>
    </>
  );
}

function SettingsPage({ form, setForm }) {
  return (
    <>
      <PageIntro
        eyebrow="Projection"
        title="Projection settings"
        description="Review when this plan started and adjust cash guardrails here, then use Monthly plan for month-of-year budget and investing patterns."
        badge="Auto-saved locally"
      />
      <Section title="Saved settings" subtitle="These values feed the overview dashboard immediately.">
        <div className="metric-grid" style={{ marginBottom: '10px' }}>
          <MetricRow label="Projection started" value={formatDate(parseLocalDate(form.startDate))} />
        </div>
        <div className="row-2">
          <Label>
            Cash reserve target
            <NumericInput value={form.cashReserveTarget} onValueChange={(next) => setForm((current) => ({ ...current, cashReserveTarget: Math.max(0, next) }))} />
          </Label>
        </div>
        <div className="row-2">
          <Label>
            Monthly discretionary budget
            <NumericInput value={form.monthlyDiscretionaryBudget} onValueChange={(next) => setForm((current) => ({ ...current, monthlyDiscretionaryBudget: Math.max(0, next) }))} />
          </Label>
        </div>
      </Section>
    </>
  );
}

function MonthWaterfallChart({ summaries }) {
  if (!summaries || summaries.length === 0) return null;
  const count = summaries.length;
  const avg = {
    income: summaries.reduce((s, m) => s + m.income, 0) / count,
    bankExpenses: summaries.reduce((s, m) => s + m.bankExpenses, 0) / count,
    cardPayments: summaries.reduce((s, m) => s + m.cardPayments, 0) / count,
    investments: summaries.reduce((s, m) => s + m.investments, 0) / count,
    discretionaryBudget: summaries.reduce((s, m) => s + Math.abs(m.discretionaryBudget || 0), 0) / count,
  };
  if (avg.income <= 0) return null;
  const rows = [
    { label: 'Bills', value: avg.bankExpenses, color: 'var(--danger)' },
    { label: 'Cards', value: avg.cardPayments, color: 'var(--warning)' },
    { label: 'Investing', value: avg.investments, color: 'var(--primary-3)' },
    { label: 'Discretionary', value: avg.discretionaryBudget, color: '#a78bfa' },
  ].filter(r => r.value > 0);
  const totalOut = rows.reduce((s, r) => s + r.value, 0);
  const net = avg.income - totalOut;
  const rowStyle = { display: 'flex', alignItems: 'center', gap: '10px', height: '26px' };
  const labelStyle = { fontSize: '0.71rem', fontWeight: 600, color: 'var(--dim)', width: '90px', textAlign: 'right', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' };
  const valStyle = { fontSize: '0.71rem', color: 'white', whiteSpace: 'nowrap', fontWeight: 700, paddingLeft: '9px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' };

  return (
    <div style={{ display: 'grid', gap: '6px' }}>
      <div style={{ ...rowStyle, height: '30px' }}>
        <span style={labelStyle}>Income</span>
        <div style={{ flex: 1, background: 'linear-gradient(90deg,rgba(78,234,160,0.8),rgba(78,234,160,0.55))', borderRadius: '6px', height: '100%', display: 'flex', alignItems: 'center', paddingLeft: '10px', boxShadow: '0 2px 8px rgba(78,234,160,0.15)' }}>
          <span style={{ ...valStyle, color: '#062214' }}>{currency.format(avg.income)}</span>
        </div>
      </div>
      {rows.map(r => (
        <div key={r.label} style={rowStyle}>
          <span style={labelStyle}>{r.label}</span>
          <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: `${Math.min(100, (r.value / avg.income) * 100)}%`,
              minWidth: r.value > 0 ? '3px' : 0,
              background: r.color,
              borderRadius: '5px',
              height: '100%',
              opacity: 0.8,
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              boxShadow: `0 2px 6px ${r.color}30`,
            }}>
              <span style={valStyle}>{currency.format(r.value)}</span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--line)', marginTop: '4px', paddingTop: '8px', ...rowStyle, height: '26px' }}>
        <span style={labelStyle}>Net</span>
        <div style={{
          flex: 1,
          background: net >= 0 ? 'var(--green-bg)' : 'var(--danger-bg)',
          border: `1px solid ${net >= 0 ? 'var(--green-border)' : 'var(--danger-border)'}`,
          borderRadius: '6px', height: '100%', display: 'flex', alignItems: 'center', paddingLeft: '10px',
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: net >= 0 ? 'var(--green)' : 'var(--danger)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {net >= 0 ? '+' : ''}{currency.format(net)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MonthlyPlanPage({ form, setForm, projection }) {
  const months = buildMonthOfYearConfigs();
  const overrideCount = Object.keys(normalizeMonthlyOverrides(form.monthlyOverrides)).length;

  const updateOverrideField = (monthKey, field, value) =>
    setForm((current) => ({
      ...current,
      monthlyOverrides: updateMonthlyOverride(current.monthlyOverrides, monthKey, { [field]: value }),
    }));

  const clearMonthOverride = (monthKey) =>
    setForm((current) => {
      const nextOverrides = normalizeMonthlyOverrides(current.monthlyOverrides);
      delete nextOverrides[monthKey];
      return { ...current, monthlyOverrides: nextOverrides };
    });

  return (
    <>
      <PageIntro
        eyebrow="Month patterns"
        title="Monthly plan patterns"
        description="Set January through December patterns once. Each projected year reuses the saved value for that month."
        badge={overrideCount ? `${overrideCount} pattern${overrideCount === 1 ? '' : 's'}` : 'Using base defaults'}
      />
      {projection?.monthlySummaries?.length ? (
        <section className="panel">
          <h2 style={{ marginBottom: '6px' }}>Average monthly cash flow</h2>
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '14px' }}>
            Averaged across {projection.monthlySummaries.length} projected month{projection.monthlySummaries.length === 1 ? '' : 's'}
          </p>
          <MonthWaterfallChart summaries={projection.monthlySummaries} />
        </section>
      ) : null}
      <Section
        title="Saved month-of-year patterns"
        subtitle="Leave a field blank to inherit the saved defaults from Settings or Investing. A January value applies to every January in the projection."
      >
        <div className="stack">
          {months.map((month) => {
            const override = getMonthlyOverride(form.monthlyOverrides, month.key);
            const resolved = getResolvedMonthPlanValues(form, month.key);
            const hasOverride = override.discretionaryBudget !== null || override.investmentAmount !== null || override.investmentDay !== null;

            return (
              <div key={month.key} className="item-card tight">
                <div className="item-footer no-margin">
                  <strong>{month.label}</strong>
                  <span className={`pill ${hasOverride ? 'outline' : 'neutral'}`}>{hasOverride ? 'Custom pattern' : 'Inheriting defaults'}</span>
                </div>
                <div className="row-3">
                  <Label hint={`Base setting: ${currency.format(form.monthlyDiscretionaryBudget)}`}>
                    Flex budget override
                    <NullableNumericInput
                      value={override.discretionaryBudget}
                      placeholder={`Default ${currency.format(form.monthlyDiscretionaryBudget)}`}
                      onValueChange={(next) => updateOverrideField(month.key, 'discretionaryBudget', next)}
                    />
                  </Label>
                  <Label hint={`Base investing amount: ${currency.format(normalizeInvestmentModel(form.investmentModel, form.accounts, form).recurringAmount)}`}>
                    Brokerage amount override
                    <NullableNumericInput
                      value={override.investmentAmount}
                      placeholder={`Default ${currency.format(normalizeInvestmentModel(form.investmentModel, form.accounts, form).recurringAmount)}`}
                      onValueChange={(next) => updateOverrideField(month.key, 'investmentAmount', next)}
                    />
                  </Label>
                  <Label hint={`Base investing day: ${normalizeInvestmentModel(form.investmentModel, form.accounts, form).recurringDayOfMonth}`}>
                    Brokerage day override
                    <NullableNumericInput
                      value={override.investmentDay}
                      integer
                      sanitize={clampDay}
                      placeholder={`Default ${normalizeInvestmentModel(form.investmentModel, form.accounts, form).recurringDayOfMonth}`}
                      onValueChange={(next) => updateOverrideField(month.key, 'investmentDay', next)}
                    />
                  </Label>
                </div>
                <div className="metric-grid">
                  <MetricRow label="Effective budget" value={currency.format(resolved.discretionaryBudget)} />
                  <MetricRow label="Effective brokerage amount" value={currency.format(resolved.investmentAmount)} />
                  <MetricRow label="Effective brokerage day" value={`Day ${resolved.investmentDay}`} />
                </div>
                {hasOverride ? (
                  <div className="button-row">
                    <span className="muted tiny">Every {month.label} now diverges from the shared defaults.</span>
                    <button className="ghost-button" onClick={() => clearMonthOverride(month.key)}>
                      Reset month
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function AccountsPage({ form, onAdd, onChange, onDelete }) {
  const cashAccounts = getCashAccounts(form.accounts);
  const investmentAccounts = getInvestmentAccounts(form.accounts);
  return (
    <>
      <PageIntro
        eyebrow="Cash setup"
        title="Accounts"
        description="Manage both cash accounts and investment accounts here so the cash and net-worth projections share the same underlying balances."
        badge={`${currency.format(totalCash(form.accounts))} cash · ${currency.format(totalInvestments(form.accounts))} invested`}
      />
      <AccountsList
        accounts={form.accounts}
        onAdd={onAdd}
        onChange={onChange}
        onDelete={onDelete}
        addLabel={investmentAccounts.length ? 'Add account' : 'Add account or investment'}
      />
    </>
  );
}

function IncomePage({ form, setForm }) {
  return (
    <>
      <PageIntro
        eyebrow="Income"
        title="Income simulator"
        description="Model salary, bonus, taxes, deductions, and 401(k) contributions by year instead of editing a post-tax paycheck by hand."
        badge={currency.format(getResolvedIncomeYearSettings(form.incomeModel, parseLocalDate(form.startDate).getFullYear()).baseSalary)}
      />
      <IncomeSimulatorEditor form={form} setForm={setForm} />
    </>
  );
}

function BillsPage({ form, onAdd, onChange, onDelete }) {
  return (
    <>
      <PageIntro
        eyebrow="Bills"
        title="Monthly bank withdrawals"
        description="Keep rent and any direct cash-pull bills together, including which account each one leaves from."
        badge={currency.format(form.recurringExpenses.reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0))}
      />
      <RecurringList title="Monthly bank withdrawals" items={form.recurringExpenses} accounts={form.accounts} addLabel="Add bill" onAdd={onAdd} onChange={onChange} onDelete={onDelete} />
    </>
  );
}

function IncomeSimulatorEditor({ form, setForm }) {
  const projectedYears = buildProjectedYearConfigs(form.startDate, form.projectionYears);
  const incomeModel = normalizeIncomeModel(form.incomeModel, form.accounts, form.paychecks, form.startDate);
  const cashAccounts = getCashAccounts(form.accounts);
  const depositAccountId = resolveCashAccountId(incomeModel.depositAccountId, cashAccounts);

  const updateIncomeModel = (patch) =>
    setForm((current) => ({
      ...current,
      incomeModel: {
        ...normalizeIncomeModel(current.incomeModel, current.accounts, current.paychecks, current.startDate),
        ...patch,
      },
    }));

  const updateYearSettings = (year, updater) =>
    setForm((current) => {
      const normalizedIncomeModel = normalizeIncomeModel(current.incomeModel, current.accounts, current.paychecks, current.startDate);
      const nextSettings = updater(createIncomeYearSettings(getResolvedIncomeYearSettings(normalizedIncomeModel, year)));
      return {
        ...current,
        incomeModel: {
          ...normalizedIncomeModel,
          yearlySettings: {
            ...normalizedIncomeModel.yearlySettings,
            [year]: createIncomeYearSettings(nextSettings),
          },
        },
      };
    });

  return (
    <>
      <Section
        title="Paycheck simulator"
        subtitle="This replaces the old percent-kept model. Salary and bonus are pre-tax, taxes are estimated from the brackets and rates you enter, and cash lands in the selected account."
      >
        <div className="row-3">
          <Label>
            Salary pay day each month
            <NumericInput value={incomeModel.payDayOfMonth} integer sanitize={clampDay} onValueChange={(next) => updateIncomeModel({ payDayOfMonth: next })} />
          </Label>
          <Label>
            Bonus month
            <NumericInput value={incomeModel.bonusMonth} integer sanitize={clampMonth} onValueChange={(next) => updateIncomeModel({ bonusMonth: next })} />
          </Label>
          <Label>
            Bonus day
            <NumericInput value={incomeModel.bonusDay} integer sanitize={clampDay} onValueChange={(next) => updateIncomeModel({ bonusDay: next })} />
          </Label>
        </div>
        <Label hint="Net pay from salary and bonus is deposited here after the simulator applies taxes and deductions.">
          Deposit paychecks into account
          <select value={depositAccountId} onChange={(e) => updateIncomeModel({ depositAccountId: e.target.value })}>
            {cashAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Label>
      </Section>

      <div className="stack">
        {projectedYears.map(({ year }) => {
          const settings = createIncomeYearSettings(getResolvedIncomeYearSettings(incomeModel, year));
          const hasExplicitYear = Boolean(incomeModel.yearlySettings?.[year]);
          const sourceYear = getResolvedIncomeYearSource(incomeModel, year);
          const previousConfiguredYear = getPreviousConfiguredIncomeYear(incomeModel, year);
          const preview = simulateIncomeYearPreview(incomeModel, year);

          const updateBrackets = (nextBrackets) =>
            updateYearSettings(year, (current) => ({ ...current, federalBrackets: nextBrackets }));
          const updateFilingStatus = (nextStatus) =>
            updateYearSettings(year, (current) => ({
              ...current,
              filingStatus: nextStatus,
              federalStandardDeduction: FEDERAL_STANDARD_DEDUCTION_2026[nextStatus] ?? current.federalStandardDeduction,
            }));
          const updatePretaxDeductions = (nextDeductions) =>
            updateYearSettings(year, (current) => ({ ...current, pretaxDeductions: nextDeductions }));
          const updatePostTaxDeductions = (nextDeductions) =>
            updateYearSettings(year, (current) => ({ ...current, postTaxDeductions: nextDeductions }));
          const resetYear = () =>
            setForm((current) => {
              const normalizedIncomeModel = normalizeIncomeModel(current.incomeModel, current.accounts, current.paychecks, current.startDate);
              if (!previousConfiguredYear) return current;
              const nextYearlySettings = { ...normalizedIncomeModel.yearlySettings };
              delete nextYearlySettings[year];
              return {
                ...current,
                incomeModel: {
                  ...normalizedIncomeModel,
                  yearlySettings: nextYearlySettings,
                },
              };
            });

          return (
            <Section
              key={year}
              title={`Income assumptions for ${year}`}
              summary={hasExplicitYear ? 'Custom year' : `Inheriting ${sourceYear}`}
              subtitle="If you leave a future year untouched, the projection carries forward the latest earlier year you configured."
              collapsible
              defaultOpen={year === projectedYears[0]?.year}
            >
              <div className="button-row">
                <span className={`pill ${hasExplicitYear ? 'outline' : 'neutral'}`}>
                  {hasExplicitYear ? `Saved separately for ${year}` : `Currently mirroring ${sourceYear}`}
                </span>
                {hasExplicitYear && previousConfiguredYear ? (
                  <button className="ghost-button" onClick={resetYear}>
                    Reset to inherit {previousConfiguredYear}
                  </button>
                ) : null}
              </div>

              <div className="summary-grid summary-grid-4">
                <MiniInfo label="Annual gross pay" value={currency.format(preview.totals.gross)} caption={`${currency.format(settings.baseSalary)} salary + ${currency.format(settings.bonusAmount)} bonus`} />
                <MiniInfo label="Annual take-home" value={currency.format(preview.totals.takeHome)} caption={`Deposited into ${getAccountNameById(form.accounts, depositAccountId)}`} />
                <MiniInfo label="Annual taxes" value={currency.format(preview.totals.taxes)} caption={`${preview.totals.effectiveTaxRate.toFixed(1)}% effective rate`} />
                <MiniInfo label="401(k) funded" value={currency.format(preview.totals.totalRetirement)} caption={`${currency.format(preview.totals.employeeRetirement)} employee + ${currency.format(preview.totals.employerMatch)} salary-only match`} />
              </div>

              <div className="row-2">
                <PaycheckBreakdownCard
                  title="Typical salary paycheck"
                  subtitle={`Monthly salary on day ${incomeModel.payDayOfMonth}`}
                  breakdown={preview.salaryPreview}
                />
                <PaycheckBreakdownCard
                  title="Bonus paycheck"
                  subtitle={preview.bonusPreview ? `Paid on ${formatDate(preview.bonusPreview.date)}` : `No bonus scheduled for ${year}`}
                  breakdown={preview.bonusPreview}
                  emptyMessage="No annual bonus is configured for this year."
                />
              </div>

              <div className="row-2">
                <Label>
                  Base salary (annual, pre-tax)
                  <NumericInput value={settings.baseSalary} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, baseSalary: Math.max(0, next) }))} />
                </Label>
                <Label>
                  Bonus (annual, paid on configured bonus date)
                  <NumericInput value={settings.bonusAmount} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, bonusAmount: Math.max(0, next) }))} />
                </Label>
              </div>

              <div className="row-3">
                <Label>
                  Roth 401(k) percent
                  <NumericInput value={settings.roth401kPercent} integer sanitize={clampPercentage} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, roth401kPercent: next }))} />
                </Label>
                <Label>
                  After-tax 401(k) percent
                  <NumericInput value={settings.afterTax401kPercent} integer sanitize={clampPercentage} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, afterTax401kPercent: next }))} />
                </Label>
                <Label hint="Applied only to base-salary paychecks, not the annual bonus.">
                  Employer match percent
                  <NumericInput value={settings.employerMatchPercent} integer sanitize={clampPercentage} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, employerMatchPercent: next }))} />
                </Label>
              </div>

              <div className="row-2">
                <Label>
                  Roth 401(k) yearly employee limit
                  <NumericInput value={settings.roth401kLimit} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, roth401kLimit: Math.max(0, next) }))} />
                </Label>
                <Label hint="Use the full plan limit here so after-tax plus employer match stop when the annual total is reached.">
                  Total 401(k) yearly plan limit
                  <NumericInput value={settings.total401kLimit} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, total401kLimit: Math.max(0, next) }))} />
                </Label>
              </div>

              <div className="row-2">
                <Label>
                  Federal standard deduction
                  <NumericInput value={settings.federalStandardDeduction} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, federalStandardDeduction: Math.max(0, next) }))} />
                </Label>
                <Label>
                  State income tax rate
                  <NumericInput value={settings.stateTaxRate} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, stateTaxRate: Math.max(0, next) }))} />
                </Label>
              </div>

              <div className="row-2">
                <Label>
                  Social Security rate
                  <NumericInput value={settings.socialSecurityRate} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, socialSecurityRate: Math.max(0, next) }))} />
                </Label>
                <Label>
                  Social Security wage base
                  <NumericInput value={settings.socialSecurityWageBase} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, socialSecurityWageBase: Math.max(0, next) }))} />
                </Label>
              </div>

              <div className="row-3">
                <Label>
                  Medicare rate
                  <NumericInput value={settings.medicareRate} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, medicareRate: Math.max(0, next) }))} />
                </Label>
                <Label>
                  Additional Medicare rate
                  <NumericInput value={settings.additionalMedicareRate} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, additionalMedicareRate: Math.max(0, next) }))} />
                </Label>
                <Label>
                  Additional Medicare threshold
                  <NumericInput value={settings.additionalMedicareThreshold} onValueChange={(next) => updateYearSettings(year, (current) => ({ ...current, additionalMedicareThreshold: Math.max(0, next) }))} />
                </Label>
              </div>

              <BracketEditor brackets={settings.federalBrackets} onChange={updateBrackets} filingStatus={settings.filingStatus} onFilingStatusChange={updateFilingStatus} />
              <DeductionEditor title="Pre-tax deductions per salary paycheck" items={settings.pretaxDeductions} onChange={updatePretaxDeductions} addLabel="Add pre-tax deduction" defaultLabel="Healthcare FSA" />
              <DeductionEditor title="Other post-tax deductions per salary paycheck" items={settings.postTaxDeductions} onChange={updatePostTaxDeductions} addLabel="Add post-tax deduction" defaultLabel="Supplemental life" />
            </Section>
          );
        })}
      </div>
    </>
  );
}

function InvestingPage({ form, setForm, projection }) {
  const investmentModel = normalizeInvestmentModel(form.investmentModel, form.accounts, form);
  const annualizedInvestment = Math.max(0, Number(investmentModel.recurringAmount) || 0) * 12;
  const cashAccounts = getCashAccounts(form.accounts);
  const investmentAccounts = getInvestmentAccounts(form.accounts);
  const destinationAccountName = investmentModel.destinationAccountId ? getAccountNameById(form.accounts, investmentModel.destinationAccountId) : 'No investment account selected';
  const retirementAccountName = investmentModel.retirementAccountId ? getAccountNameById(form.accounts, investmentModel.retirementAccountId) : 'No retirement account selected';
  const safeAmount = projection ? Math.max(0, projection.safeMonthlyInvestAmount) : null;

  return (
    <>
      {safeAmount !== null ? (
        <div style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg,rgba(110,166,255,0.1),rgba(72,120,255,0.06))',
          border: '1px solid var(--primary-border)',
          display: 'flex', alignItems: 'center', gap: '16px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 16px rgba(72,120,255,0.1)',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,var(--primary),var(--primary-2))', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 4px 14px var(--primary-glow)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,14 6,8 10,11 16,3"/><polyline points="12,3 16,3 16,7"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--primary-3)', marginBottom: '3px' }}>Safe to invest based on cash flow</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--soft)', lineHeight: 1.45 }}>
              Up to <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{currency.format(safeAmount)}/mo</span> without breaching your reserve target.
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{currency.format(safeAmount)}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '1px' }}>per month</div>
          </div>
        </div>
      ) : null}
      <PageIntro
        eyebrow="Investing"
        title="Recurring investment plan"
        description="Track the default brokerage funding plan and the projected return used for net-worth projections. Starting invested balances now live in the Accounts tab as investment accounts."
        badge={investmentModel.recurringAmount > 0 ? `${currency.format(investmentModel.recurringAmount)} monthly` : 'Not scheduled'}
      />
      <Section
        title="Investment settings"
        subtitle="Brokerage contributions pull from a cash account into an investment account. Simulated 401(k) contributions land in the selected retirement account. Use Monthly plan for month-of-year changes to this default schedule."
      >
        {investmentAccounts.length === 0 ? (
          <p className="section-note no-bottom">
            Add at least one investment account from the Accounts tab before scheduling brokerage funding or retirement destinations.
          </p>
        ) : null}
        <div className="row-3">
          <Label>
            Brokerage source account
            <select
              value={resolveCashAccountId(investmentModel.sourceAccountId, cashAccounts)}
              onChange={(e) => setForm((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), sourceAccountId: e.target.value } }))}
            >
              {cashAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Label>
          <Label>
            Brokerage destination account
            <select
              value={resolveInvestmentAccountId(investmentModel.destinationAccountId, investmentAccounts)}
              onChange={(e) => setForm((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), destinationAccountId: e.target.value } }))}
              disabled={!investmentAccounts.length}
            >
              {investmentAccounts.length ? investmentAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {getInvestmentSubtypeLabel(account.investmentSubtype)}
                </option>
              )) : <option value="">Add an investment account first</option>}
            </select>
          </Label>
          <Label>
            Brokerage investment day
            <NumericInput
              value={investmentModel.recurringDayOfMonth}
              integer
              sanitize={clampDay}
              onValueChange={(next) => setForm((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), recurringDayOfMonth: next } }))}
            />
          </Label>
          <Label>
            Brokerage amount each month
            <NumericInput
              value={investmentModel.recurringAmount}
              onValueChange={(next) => setForm((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), recurringAmount: Math.max(0, next) } }))}
            />
          </Label>
        </div>
        <div className="row-3">
          <Label>
            401(k) destination account
            <select
              value={resolveInvestmentAccountId(investmentModel.retirementAccountId, investmentAccounts)}
              onChange={(e) => setForm((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), retirementAccountId: e.target.value } }))}
              disabled={!investmentAccounts.length}
            >
              {investmentAccounts.length ? investmentAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {getInvestmentSubtypeLabel(account.investmentSubtype)}
                </option>
              )) : <option value="">Add an investment account first</option>}
            </select>
          </Label>
          <Label>
            Projected return per year
            <NumericInput
              value={investmentModel.annualReturnRate}
              onValueChange={(next) => setForm((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), annualReturnRate: next } }))}
            />
          </Label>
        </div>
        <div className="summary-grid summary-grid-3">
          <MiniInfo label="Schedule" value={`Day ${investmentModel.recurringDayOfMonth}`} caption={`From ${getAccountNameById(form.accounts, investmentModel.sourceAccountId)} to ${destinationAccountName}`} />
          <MiniInfo label="Retirement destination" value={retirementAccountName} caption="Receives simulated 401(k) contributions and match" />
          <MiniInfo label="Annualized" value={currency.format(annualizedInvestment)} caption={`${investmentModel.annualReturnRate}% yearly return assumption`} />
        </div>
      </Section>
    </>
  );
}

function BracketEditor({ brackets, onChange, filingStatus = 'single', onFilingStatusChange }) {
  const [customizing, setCustomizing] = useState(false);
  const standard2026 = FEDERAL_BRACKETS_2026[filingStatus] || FEDERAL_BRACKETS_2026.single;

  const applyStandard = (status) => {
    const brackets2026 = FEDERAL_BRACKETS_2026[status] || FEDERAL_BRACKETS_2026.single;
    onChange(normalizeTaxBrackets(brackets2026.map((b) => createTaxBracket(b.upTo, b.rate)), status));
  };

  const handleFilingStatusChange = (nextStatus) => {
    onFilingStatusChange?.(nextStatus);
    applyStandard(nextStatus);
  };

  return (
    <Section
      title="Federal income tax brackets"
      summary="2026 standard"
      subtitle="Marginal rates applied to taxable income after the standard deduction."
      collapsible
      defaultOpen={false}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Label>
          Filing status
          <select
            value={filingStatus}
            onChange={(e) => handleFilingStatusChange(e.target.value)}
            style={{ minWidth: '220px' }}
          >
            {FILING_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Label>
        <button
          type="button"
          className="ghost-button"
          style={{ marginBottom: '4px' }}
          onClick={() => {
            applyStandard(filingStatus);
            setCustomizing(false);
          }}
        >
          Reset to 2026 standard
        </button>
      </div>

      {!customizing ? (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line-2)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Taxable income</th>
                  <th style={{ textAlign: 'right', padding: '6px 10px', color: 'var(--muted)', fontWeight: 600 }}>Marginal rate</th>
                </tr>
              </thead>
              <tbody>
                {standard2026.map((bracket, index) => {
                  const prev = standard2026[index - 1];
                  const from = prev ? `${currency.format(prev.upTo + 1)}+` : '$0';
                  const label = bracket.upTo === 0
                    ? `Over ${currency.format(standard2026[index - 1]?.upTo ?? 0)}`
                    : `${from} – ${currency.format(bracket.upTo)}`;
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '7px 10px', color: 'var(--soft)' }}>{label}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{bracket.rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="ghost-button" style={{ marginTop: '4px' }} onClick={() => setCustomizing(true)}>
            Customize brackets
          </button>
        </>
      ) : (
        <>
          <div className="stack">
            {brackets.map((bracket) => {
              const isTopBracket = bracket.upTo === 0;
              return (
                <div key={bracket.id} className="item-card tight">
                  <div className={isTopBracket ? 'stack' : 'row-2'}>
                    {!isTopBracket && (
                      <Label>
                        Upper bound
                        <NumericInput
                          value={bracket.upTo}
                          onValueChange={(next) => onChange(normalizeTaxBrackets(brackets.map((item) => (item.id === bracket.id ? { ...item, upTo: Math.max(0, next) } : item)), filingStatus))}
                        />
                      </Label>
                    )}
                    <Label>
                      Marginal rate
                      <NumericInput
                        value={bracket.rate}
                        onValueChange={(next) => onChange(normalizeTaxBrackets(brackets.map((item) => (item.id === bracket.id ? { ...item, rate: Math.max(0, next) } : item)), filingStatus))}
                      />
                    </Label>
                  </div>
                  <div className="item-footer">
                    <span className="pill neutral">{isTopBracket ? 'Top bracket' : `Up to ${currency.format(bracket.upTo)}`}</span>
                    <button className="ghost-button" onClick={() => onChange(normalizeTaxBrackets(brackets.filter((item) => item.id !== bracket.id), filingStatus))} disabled={brackets.length === 1}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="secondary-button" onClick={() => onChange(normalizeTaxBrackets([...brackets, createTaxBracket(0, brackets.at(-1)?.rate || 0)], filingStatus))}>
              Add bracket
            </button>
            <button type="button" className="ghost-button" onClick={() => setCustomizing(false)}>
              Back to standard view
            </button>
          </div>
        </>
      )}
    </Section>
  );
}

function DeductionEditor({ title, items, onChange, addLabel, defaultLabel }) {
  return (
    <Section title={title} summary={`${items.length} item${items.length === 1 ? '' : 's'}`} collapsible defaultOpen={false}>
      <div className="stack">
        {items.map((item) => (
          <div key={item.id} className="item-card tight">
            <Label>
              Label
              <input value={item.label} onChange={(e) => onChange(normalizeDeductionList(items.map((entry) => (entry.id === item.id ? { ...entry, label: e.target.value } : entry)), defaultLabel))} />
            </Label>
            <Label>
              Amount per salary paycheck
              <NumericInput value={item.amount} onValueChange={(next) => onChange(normalizeDeductionList(items.map((entry) => (entry.id === item.id ? { ...entry, amount: Math.max(0, next) } : entry)), defaultLabel))} />
            </Label>
            <div className="item-footer">
              <span className="pill neutral">{currency.format(item.amount)}</span>
              <button className="ghost-button" onClick={() => onChange(normalizeDeductionList(items.filter((entry) => entry.id !== item.id), defaultLabel))}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="secondary-button" onClick={() => onChange(normalizeDeductionList([...items, createDeduction(defaultLabel)], defaultLabel))}>
        {addLabel}
      </button>
    </Section>
  );
}

function PaycheckBreakdownCard({ title, subtitle, breakdown, emptyMessage = 'No paycheck preview available yet.' }) {
  if (!breakdown) {
    return (
      <div className="explain-card stack-sm">
        <div>
          <strong style={{ fontSize: '0.88rem', fontWeight: 700 }}>{title}</strong>
          <p className="muted no-bottom" style={{ fontSize: '0.78rem', marginTop: '2px' }}>{subtitle}</p>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--dim)', fontStyle: 'italic' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="explain-card stack-sm">
      <div>
        <strong style={{ fontSize: '0.88rem', fontWeight: 700 }}>{title}</strong>
        <p className="muted no-bottom" style={{ fontSize: '0.78rem', marginTop: '2px' }}>{subtitle}</p>
      </div>
      <MetricRow label="Gross pay" value={currency.format(breakdown.gross)} />
      <MetricRow label="Pre-tax deductions" value={`-${currency.format(breakdown.pretaxDeductions)}`} subtle />
      <MetricRow label="Federal tax" value={`-${currency.format(breakdown.federalTax)}`} subtle />
      <MetricRow label="State tax" value={`-${currency.format(breakdown.stateTax)}`} subtle />
      <MetricRow label="Social Security" value={`-${currency.format(breakdown.socialSecurityTax)}`} subtle />
      <MetricRow label="Medicare" value={`-${currency.format(breakdown.medicareTax + breakdown.additionalMedicareTax)}`} subtle />
      <MetricRow label="Roth 401(k)" value={`-${currency.format(breakdown.rothContribution)}`} subtle />
      <MetricRow label="After-tax 401(k)" value={`-${currency.format(breakdown.afterTaxContribution)}`} subtle />
      <MetricRow label="Other post-tax" value={`-${currency.format(breakdown.postTaxDeductions)}`} subtle />
      <MetricRow label="Net pay to bank" value={currency.format(breakdown.netCash)} />
      <MetricRow label="Employer 401(k) match" value={currency.format(breakdown.employerMatch)} subtle />
    </div>
  );
}

function CardsPage({ form, setForm }) {
  const currentDueTotal = form.creditCards.reduce((sum, card) => sum + Math.abs(Number(card.currentBalance) || 0), 0);
  const accruedTotal = form.creditCards.reduce((sum, card) => sum + Math.abs(Number(card.accruedBalance) || 0), 0);
  const totalFloat = currentDueTotal + accruedTotal;
  const totalMonthlySpend = form.creditCards.reduce((sum, card) => sum + Math.abs(Number(card.monthlySpend) || 0), 0);
  const avgCycleDays = form.creditCards.length > 0
    ? Math.round(form.creditCards.reduce((sum, card) => {
        const days = ((card.dueDay - card.statementDay + 31) % 31) || 30;
        return sum + days;
      }, 0) / form.creditCards.length)
    : 0;

  return (
    <>
      <PageIntro
        eyebrow="Cards"
        title="Credit cards"
        description="Track what is due next, what has accrued since statement close, and the normal later statement amount without crowding the rest of the planner."
        badge={`${currency.format(currentDueTotal)} next · ${currency.format(accruedTotal)} in flight`}
      />
      {form.creditCards.length > 0 ? (
        <section className="panel">
          <div className="summary-grid summary-grid-3">
            <MiniInfo label="Total float outstanding" value={currency.format(totalFloat)} caption="Current + accrued balances across all cards" />
            <MiniInfo label="Monthly card spend" value={currency.format(totalMonthlySpend)} caption="Estimated recurring statement payments" />
            <MiniInfo label="Avg payment cycle" value={`${avgCycleDays} days`} caption="Average days from statement close to due date" />
          </div>
        </section>
      ) : null}
      <CreditCardList form={form} setForm={setForm} />
    </>
  );
}

function PageIntro({ eyebrow, title, description, badge = '' }) {
  return (
    <section className="panel page-intro">
      <div className="page-intro-copy">
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.03em' }}>{title}</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6, marginTop: '3px' }}>{description}</p>
        </div>
      </div>
      {badge ? <div className="pill neutral" style={{ flexShrink: 0 }}>{badge}</div> : null}
    </section>
  );
}

function OnboardingFlow({ initialPlan, initialStepIndex = 0, onSaveProgress, onComplete, dbPath, statusMessage, userEmail, onLogout }) {
  const [stepIndex, setStepIndex] = useState(() => clampOnboardingStepIndex(initialStepIndex));
  const [draft, setDraft] = useState(() => normalizePlan(initialPlan));
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const steps = ONBOARDING_STEPS;

  useEffect(() => {
    if (isCompleting) return undefined;

    const timeoutId = window.setTimeout(() => {
      onSaveProgress?.(draft, stepIndex);
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [draft, stepIndex, isCompleting, onSaveProgress]);

  const canContinue = validateOnboardingStep(stepIndex, draft);
  const nextLabel = stepIndex === steps.length - 1 ? 'Save and enter app' : 'Next';

  const goNext = async () => {
    if (!canContinue) return;
    if (stepIndex === steps.length - 1) {
      setIsCompleting(true);
      const completed = await onComplete(draft);
      if (!completed) setIsCompleting(false);
      return;
    }
    setStepIndex((value) => value + 1);
  };

  const saveProgressNow = async () => {
    setIsSavingProgress(true);
    await onSaveProgress?.(draft, stepIndex);
    setIsSavingProgress(false);
  };

  return (
    <div className="onboarding-shell">
      <aside className="onboarding-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '4px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,var(--primary),var(--primary-2))', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 3px 12px var(--primary-glow)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,12 5,7 9,10 15,2"/></svg>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.025em' }}>BalTrack Setup</span>
        </div>
        <h1 style={{ fontSize: '1.35rem', marginBottom: '6px' }}>Build your plan</h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '4px' }}>
          Enter your starting numbers once — BalTrack saves them to your cloud account.
        </p>
        <div className="save-strip" style={{ marginBottom: '4px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{userEmail}</span>
          <button className="ghost-button" type="button" style={{ padding: '4px 9px', fontSize: '0.76rem' }} onClick={onLogout}>Sign out</button>
        </div>
        <div className="progress-list">
          {steps.map((label, index) => (
            <button
              key={label}
              className={`progress-step ${index === stepIndex ? 'active' : ''} ${index < stepIndex ? 'done' : ''}`}
              onClick={() => setStepIndex(index)}
            >
              <span>
                {index < stepIndex
                  ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6.5 5,9 10,3"/></svg>
                  : index + 1}
              </span>
              <strong style={{ fontSize: '0.84rem', fontWeight: index === stepIndex ? 700 : 500 }}>{label}</strong>
            </button>
          ))}
        </div>
        <div style={{ padding: '11px 13px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)', display: 'grid', gap: '4px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--dim)' }}>Status</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.4 }}>{statusMessage}</p>
          {dbPath ? <p style={{ fontSize: '0.7rem', color: 'var(--dim)' }}>Storage: {dbPath}</p> : null}
        </div>
      </aside>

      <main className="onboarding-main">
        <div className="hero-card">
          {stepIndex === 0 ? <WelcomeStep /> : null}
          {stepIndex === 1 ? <AccountsStep draft={draft} setDraft={setDraft} /> : null}
          {stepIndex === 2 ? <IncomeStep draft={draft} setDraft={setDraft} /> : null}
          {stepIndex === 3 ? <BillsStep draft={draft} setDraft={setDraft} /> : null}
          {stepIndex === 4 ? <CardsStep draft={draft} setDraft={setDraft} /> : null}
          {stepIndex === 5 ? <BudgetStep draft={draft} setDraft={setDraft} /> : null}
          {stepIndex === 6 ? <InvestingStep draft={draft} setDraft={setDraft} /> : null}
          {stepIndex === 7 ? <ReviewStep draft={draft} /> : null}

          <div className="wizard-footer">
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="ghost-button" disabled={stepIndex === 0} onClick={() => setStepIndex((value) => value - 1)}>
                Back
              </button>
              <button className="secondary-button" disabled={isSavingProgress || isCompleting} onClick={saveProgressNow}>
                {isSavingProgress ? 'Saving...' : 'Save progress'}
              </button>
            </div>
            <button className="primary-button" disabled={!canContinue || isCompleting} onClick={goNext}>
              {isCompleting ? 'Saving...' : nextLabel}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">First run</div>
        <h2 className="display-title">Let&apos;s build your real plan.</h2>
        <p className="muted large-copy">
          You&apos;ll enter your cash accounts, recurring income, recurring bills, credit cards, your monthly comfort buffer, and your investment plan.
        </p>
      </div>
    </div>
  );
}

function AccountsStep({ draft, setDraft }) {
  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">Step 2</div>
        <h2 className="display-title">Add your accounts</h2>
        <p className="muted large-copy">Set up both cash accounts and investment accounts here. Cash drives bill timing, while investment accounts feed the net-worth projection.</p>
      </div>
      <AccountsList
        accounts={draft.accounts}
        addLabel="Add account"
        onAdd={() => setDraft((current) => ({ ...current, accounts: [...current.accounts, createAccount()] }))}
        onChange={(id, patch) =>
          setDraft((current) => ({
            ...current,
            accounts: current.accounts.map((item) => (item.id === id ? { ...item, ...patch } : item)),
          }))
        }
        onDelete={(id) =>
          setDraft((current) => removeAccountFromPlan(current, id))
        }
      />
    </div>
  );
}

function SimpleTakeHomeForm({ draft, setDraft, currentYear }) {
  const incomeModel = normalizeIncomeModel(draft.incomeModel, draft.accounts, draft.paychecks, draft.startDate);
  const settings = getResolvedIncomeYearSettings(incomeModel, currentYear);
  const monthlyNet = settings.baseSalary > 0 ? Math.round(settings.baseSalary / 12) : 0;

  const updateTakeHome = (monthly) => {
    setDraft((current) => {
      const normalized = normalizeIncomeModel(current.incomeModel, current.accounts, current.paychecks, current.startDate);
      return {
        ...current,
        incomeModel: {
          ...normalized,
          yearlySettings: {
            ...normalized.yearlySettings,
            [currentYear]: {
              ...createIncomeYearSettings(getResolvedIncomeYearSettings(normalized, currentYear)),
              baseSalary: monthly * 12,
              stateTaxRate: 0,
              socialSecurityRate: 0,
              medicareRate: 0,
              additionalMedicareRate: 0,
              roth401kPercent: 0,
              afterTax401kPercent: 0,
              employerMatchPercent: 0,
              federalBrackets: [createTaxBracket(0, 0)],
              pretaxDeductions: [],
              postTaxDeductions: [],
            },
          },
        },
      };
    });
  };

  return (
    <div className="section-block onboarding-fields">
      <div className="row-2">
        <Label hint="The amount that lands in your bank each month after all taxes and deductions.">
          Monthly take-home pay
          <NumericInput value={monthlyNet} onValueChange={updateTakeHome} />
        </Label>
        <Label>
          Pay day each month
          <NumericInput
            value={incomeModel.payDayOfMonth}
            integer
            sanitize={clampDay}
            onValueChange={(next) =>
              setDraft((current) => ({
                ...current,
                incomeModel: { ...normalizeIncomeModel(current.incomeModel, current.accounts, current.paychecks, current.startDate), payDayOfMonth: next },
              }))
            }
          />
        </Label>
      </div>
      <p className="section-note">Switch to the full simulator above to model gross salary, tax brackets, 401(k) withholding, and bonus timing.</p>
    </div>
  );
}

function PaycheckImportForm({ draft, setDraft, currentYear, onApplied }) {
  const [gross, setGross] = useState(0);
  const [stateTax, setStateTax] = useState(0);
  const [oasdi, setOasdi] = useState(0);
  const [medicare, setMedicare] = useState(0);
  const [roth401k, setRoth401k] = useState(0);
  const [afterTax401k, setAfterTax401k] = useState(0);
  const [employerMatch, setEmployerMatch] = useState(0);
  const [pretaxItems, setPretaxItems] = useState([{ id: makeId(), label: 'Healthcare FSA', amount: 0 }]);
  const [postTaxItems, setPostTaxItems] = useState([]);
  const [filingStatus, setFilingStatus] = useState('single');
  const [applied, setApplied] = useState(false);

  const pretaxTotal = pretaxItems.reduce((sum, item) => sum + item.amount, 0);
  const taxableWages = Math.max(0, gross - pretaxTotal);
  const stateTaxRate = taxableWages > 0 ? (stateTax / taxableWages) * 100 : 0;
  const ssRate = gross > 0 ? (oasdi / gross) * 100 : 0;
  const medicareRate = gross > 0 ? (medicare / gross) * 100 : 0;
  const rothPct = gross > 0 ? (roth401k / gross) * 100 : 0;
  const afterTaxPct = gross > 0 ? (afterTax401k / gross) * 100 : 0;
  const matchPct = gross > 0 ? (employerMatch / gross) * 100 : 0;

  const canApply = gross > 0;

  const apply = () => {
    setDraft((current) => {
      const normalized = normalizeIncomeModel(current.incomeModel, current.accounts, current.paychecks, current.startDate);
      const existing = createIncomeYearSettings(getResolvedIncomeYearSettings(normalized, currentYear));
      const brackets2026 = (FEDERAL_BRACKETS_2026[filingStatus] || FEDERAL_BRACKETS_2026.single).map((b) => createTaxBracket(b.upTo, b.rate));
      return {
        ...current,
        incomeModel: {
          ...normalized,
          yearlySettings: {
            ...normalized.yearlySettings,
            [currentYear]: createIncomeYearSettings({
              ...existing,
              filingStatus,
              baseSalary: gross * 12,
              federalStandardDeduction: FEDERAL_STANDARD_DEDUCTION_2026[filingStatus],
              federalBrackets: brackets2026,
              stateTaxRate: Math.round(stateTaxRate * 100) / 100,
              socialSecurityRate: 6.2,
              medicareRate: 1.45,
              roth401kPercent: Math.round(rothPct * 100) / 100,
              afterTax401kPercent: Math.round(afterTaxPct * 100) / 100,
              employerMatchPercent: Math.round(matchPct * 100) / 100,
              pretaxDeductions: pretaxItems.filter((item) => item.amount > 0),
              postTaxDeductions: postTaxItems.filter((item) => item.amount > 0),
            }),
          },
        },
      };
    });
    setApplied(true);
    onApplied?.();
  };

  const pillStyle = { fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary-border)', fontVariantNumeric: 'tabular-nums' };

  return (
    <div className="section-block onboarding-fields">
      <p className="section-note" style={{ marginTop: 0 }}>
        Enter amounts directly from your last regular salary paycheck. Federal brackets are filled in automatically using 2026 IRS tables.
      </p>

      <div className="row-2">
        <Label>
          Filing status
          <select value={filingStatus} onChange={(e) => setFilingStatus(e.target.value)}>
            {FILING_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Label>
        <Label hint="Your monthly gross before any deductions or taxes.">
          Gross pay (this paycheck)
          <NumericInput value={gross} onValueChange={setGross} />
        </Label>
      </div>

      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', margin: '4px 0 2px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Taxes withheld</div>
      <div className="row-2" style={{ alignItems: 'end' }}>
        <Label hint="Federal income tax withheld — brackets are set automatically from 2026 IRS tables.">
          Federal income tax (for reference)
          <NumericInput value={0} onValueChange={() => {}} />
          <span className="input-hint" style={{ color: 'var(--primary)', fontStyle: 'normal' }}>Auto-filled from 2026 {FILING_STATUS_OPTIONS.find((o) => o.value === filingStatus)?.label} brackets</span>
        </Label>
        <Label hint="State income tax withheld this paycheck — used to calculate your effective state rate.">
          State income tax
          <NumericInput value={stateTax} onValueChange={setStateTax} />
          {stateTaxRate > 0 && <span style={pillStyle}>{stateTaxRate.toFixed(2)}% rate</span>}
        </Label>
      </div>
      <div className="row-2">
        <Label hint="OASDI / Social Security withheld.">
          Social Security (OASDI)
          <NumericInput value={oasdi} onValueChange={setOasdi} />
          {ssRate > 0 && <span style={pillStyle}>{ssRate.toFixed(2)}% rate</span>}
        </Label>
        <Label hint="Medicare tax withheld (standard 1.45%).">
          Medicare
          <NumericInput value={medicare} onValueChange={setMedicare} />
          {medicareRate > 0 && <span style={pillStyle}>{medicareRate.toFixed(2)}% rate</span>}
        </Label>
      </div>

      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', margin: '4px 0 2px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Pre-tax deductions</div>
      <div className="stack">
        {pretaxItems.map((item) => (
          <div key={item.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <Label>
              Label
              <input
                value={item.label}
                onChange={(e) => setPretaxItems((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, label: e.target.value } : entry))}
              />
            </Label>
            <Label>
              Amount
              <NumericInput value={item.amount} onValueChange={(next) => setPretaxItems((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, amount: next } : entry))} />
            </Label>
            <button className="ghost-button" style={{ marginBottom: '4px' }} onClick={() => setPretaxItems((prev) => prev.filter((entry) => entry.id !== item.id))}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <button className="ghost-button" onClick={() => setPretaxItems((prev) => [...prev, { id: makeId(), label: 'Healthcare FSA', amount: 0 }])}>
        + Add pre-tax deduction
      </button>

      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', margin: '8px 0 2px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>401(k) contributions</div>
      <div className="row-3">
        <Label hint="Employee Roth 401(k) withheld this paycheck.">
          Roth 401(k)
          <NumericInput value={roth401k} onValueChange={setRoth401k} />
          {rothPct > 0 && <span style={pillStyle}>{rothPct.toFixed(2)}%</span>}
        </Label>
        <Label hint="Employee after-tax 401(k) withheld this paycheck.">
          After-tax 401(k)
          <NumericInput value={afterTax401k} onValueChange={setAfterTax401k} />
          {afterTaxPct > 0 && <span style={pillStyle}>{afterTaxPct.toFixed(2)}%</span>}
        </Label>
        <Label hint="Employer match deposited this paycheck.">
          Employer match
          <NumericInput value={employerMatch} onValueChange={setEmployerMatch} />
          {matchPct > 0 && <span style={pillStyle}>{matchPct.toFixed(2)}%</span>}
        </Label>
      </div>

      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', margin: '4px 0 2px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Other post-tax deductions</div>
      <div className="stack">
        {postTaxItems.map((item) => (
          <div key={item.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <Label>
              Label
              <input
                value={item.label}
                onChange={(e) => setPostTaxItems((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, label: e.target.value } : entry))}
              />
            </Label>
            <Label>
              Amount
              <NumericInput value={item.amount} onValueChange={(next) => setPostTaxItems((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, amount: next } : entry))} />
            </Label>
            <button className="ghost-button" style={{ marginBottom: '4px' }} onClick={() => setPostTaxItems((prev) => prev.filter((entry) => entry.id !== item.id))}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <button className="ghost-button" onClick={() => setPostTaxItems((prev) => [...prev, { id: makeId(), label: 'AD&D Post', amount: 0 }])}>
        + Add post-tax deduction
      </button>

      <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="primary-button" disabled={!canApply} onClick={apply}>
          Apply to income settings
        </button>
        {applied && (
          <span style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600 }}>
            Settings applied — switch to Full simulator to review or fine-tune.
          </span>
        )}
      </div>
    </div>
  );
}

function IncomeStep({ draft, setDraft }) {
  const [incomeMode, setIncomeMode] = useState('simple');
  const currentYear = parseLocalDate(draft.startDate).getFullYear();

  const activeStyle = { borderColor: 'rgba(111,163,255,0.45)', color: 'var(--text)', background: 'var(--primary-bg)' };

  const descriptions = {
    simple: 'Enter the amount that hits your bank after all taxes — you can always switch to the full simulator later.',
    paycheck: 'Enter numbers from your last pay stub and we\'ll calculate the rates. Federal brackets are filled in automatically from 2026 IRS tables.',
    full: 'Model gross salary, tax brackets, deductions, and 401(k) contributions so the planner estimates take-home precisely.',
  };

  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">Step 3</div>
        <h2 className="display-title">Set up your income</h2>
        <p className="muted large-copy">{descriptions[incomeMode]}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" className="ghost-button" style={incomeMode === 'simple' ? activeStyle : {}} onClick={() => setIncomeMode('simple')}>
          Take-home pay
        </button>
        <button type="button" className="ghost-button" style={incomeMode === 'paycheck' ? activeStyle : {}} onClick={() => setIncomeMode('paycheck')}>
          Import from paycheck
        </button>
        <button type="button" className="ghost-button" style={incomeMode === 'full' ? activeStyle : {}} onClick={() => setIncomeMode('full')}>
          Full simulator
        </button>
      </div>
      {incomeMode === 'simple' && <SimpleTakeHomeForm draft={draft} setDraft={setDraft} currentYear={currentYear} />}
      {incomeMode === 'paycheck' && (
        <PaycheckImportForm
          draft={draft}
          setDraft={setDraft}
          currentYear={currentYear}
          onApplied={() => setIncomeMode('full')}
        />
      )}
      {incomeMode === 'full' && <IncomeSimulatorEditor form={draft} setForm={setDraft} />}
    </div>
  );
}

function BillsStep({ draft, setDraft }) {
  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">Step 4</div>
        <h2 className="display-title">Add recurring bank withdrawals</h2>
        <p className="muted large-copy">Use this for rent and any recurring bills that pull directly from cash, and assign the account they leave from.</p>
      </div>
      <RecurringList
        title="Bills"
        items={draft.recurringExpenses}
        addLabel="Add bill"
        accounts={draft.accounts}
        onAdd={() => setDraft((current) => ({ ...current, recurringExpenses: [...current.recurringExpenses, createExpense(getPrimaryAccountId(current.accounts))] }))}
        onChange={(id, patch) =>
          setDraft((current) => ({
            ...current,
            recurringExpenses: current.recurringExpenses.map((item) => (item.id === id ? { ...item, ...patch } : item)),
          }))
        }
        onDelete={(id) =>
          setDraft((current) => ({
            ...current,
            recurringExpenses: current.recurringExpenses.filter((item) => item.id !== id),
          }))
        }
      />
    </div>
  );
}

function CardsStep({ draft, setDraft }) {
  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">Step 5</div>
        <h2 className="display-title">Add credit cards</h2>
        <p className="muted large-copy">Track what is due next, what has accrued since the statement closed, the typical statement amount after that, and which bank account each autopay pulls from.</p>
      </div>
      <CreditCardList form={draft} setForm={setDraft} />
    </div>
  );
}

function BudgetStep({ draft, setDraft }) {
  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">Step 6</div>
        <h2 className="display-title">Set your budget guardrails</h2>
        <p className="muted large-copy">These numbers power your cash guardrails. You&apos;ll configure brokerage funding and projected return in the next step.</p>
      </div>
      <div className="section-block onboarding-fields">
        <div className="row-2">
          <Label>
            Monthly discretionary budget
            <NumericInput value={draft.monthlyDiscretionaryBudget} onValueChange={(next) => setDraft((current) => ({ ...current, monthlyDiscretionaryBudget: Math.max(0, next) }))} />
          </Label>
          <Label>
            Minimum cash reserve
            <NumericInput value={draft.cashReserveTarget} onValueChange={(next) => setDraft((current) => ({ ...current, cashReserveTarget: Math.max(0, next) }))} />
          </Label>
        </div>
      </div>
    </div>
  );
}

function InvestingStep({ draft, setDraft }) {
  const investmentModel = normalizeInvestmentModel(draft.investmentModel, draft.accounts, draft);
  const cashAccounts = getCashAccounts(draft.accounts);
  const investmentAccounts = getInvestmentAccounts(draft.accounts);

  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">Step 7</div>
        <h2 className="display-title">Set up your investment plan</h2>
        <p className="muted large-copy">Configure your recurring brokerage contributions, 401(k) destination, and projected return rate. All of this can be changed later from the Investing tab.</p>
      </div>
      {investmentAccounts.length === 0 ? (
        <p className="section-note">No investment accounts found — you can add them from the Accounts tab after setup, then configure these settings from the Investing tab.</p>
      ) : null}
      <div className="section-block onboarding-fields">
        <div className="row-2">
          <Label>
            Brokerage source account
            <select
              value={resolveCashAccountId(investmentModel.sourceAccountId, cashAccounts)}
              onChange={(e) => setDraft((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), sourceAccountId: e.target.value } }))}
            >
              {cashAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Label>
          <Label>
            Brokerage destination account
            <select
              value={resolveInvestmentAccountId(investmentModel.destinationAccountId, investmentAccounts)}
              onChange={(e) => setDraft((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), destinationAccountId: e.target.value } }))}
              disabled={!investmentAccounts.length}
            >
              {investmentAccounts.length ? investmentAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name} · {getInvestmentSubtypeLabel(account.investmentSubtype)}</option>
              )) : <option value="">Add an investment account first</option>}
            </select>
          </Label>
        </div>
        <div className="row-3">
          <Label>
            Investment day of month
            <NumericInput
              value={investmentModel.recurringDayOfMonth}
              integer
              sanitize={clampDay}
              onValueChange={(next) => setDraft((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), recurringDayOfMonth: next } }))}
            />
          </Label>
          <Label>
            Monthly brokerage amount
            <NumericInput
              value={investmentModel.recurringAmount}
              onValueChange={(next) => setDraft((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), recurringAmount: Math.max(0, next) } }))}
            />
          </Label>
          <Label>
            Projected return per year (%)
            <NumericInput
              value={investmentModel.annualReturnRate}
              onValueChange={(next) => setDraft((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), annualReturnRate: next } }))}
            />
          </Label>
        </div>
        <div className="row-2">
          <Label>
            401(k) destination account
            <select
              value={resolveInvestmentAccountId(investmentModel.retirementAccountId, investmentAccounts)}
              onChange={(e) => setDraft((current) => ({ ...current, investmentModel: { ...normalizeInvestmentModel(current.investmentModel, current.accounts, current), retirementAccountId: e.target.value } }))}
              disabled={!investmentAccounts.length}
            >
              {investmentAccounts.length ? investmentAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name} · {getInvestmentSubtypeLabel(account.investmentSubtype)}</option>
              )) : <option value="">Add an investment account first</option>}
            </select>
          </Label>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ draft }) {
  const projection = buildProjection(draft);
  const currentMonth = projection.monthlySummaries[0];
  const cashAccounts = getCashAccounts(draft.accounts);
  const investmentAccounts = getInvestmentAccounts(draft.accounts);

  return (
    <div className="stack-lg">
      <div>
        <div className="eyebrow">Step 8</div>
        <h2 className="display-title">Review before saving</h2>
        <p className="muted large-copy">You can change all of this later. This just creates your starting plan.</p>
      </div>
      <div className="summary-grid summary-grid-3">
        <MiniInfo label="Starting cash" value={currency.format(totalCash(draft.accounts))} caption={`${cashAccounts.length} cash account${cashAccounts.length === 1 ? '' : 's'}`} />
        <MiniInfo label="Starting invested assets" value={currency.format(totalInvestments(draft.accounts))} caption={`${investmentAccounts.length} investment account${investmentAccounts.length === 1 ? '' : 's'}`} />
        <MiniInfo label="Average projected take-home" value={currency.format(projection.monthlyIncomeEstimate)} caption="Based on the current chart horizon" />
      </div>
      <div className="summary-grid summary-grid-3">
        <MiniInfo label="Next due card balances" value={currency.format(draft.creditCards.reduce((sum, card) => sum + Number(card.currentBalance || 0), 0))} caption={`${draft.creditCards.length} card${draft.creditCards.length === 1 ? '' : 's'} tracked`} />
        <MiniInfo label="Post-statement card float" value={currency.format(draft.creditCards.reduce((sum, card) => sum + Number(card.accruedBalance || 0), 0))} caption="Due one cycle after the next due date" />
        <MiniInfo label="Safe to spend this month" value={currency.format(currentMonth?.availableForBudget ?? 0)} caption={currentMonth?.monthLabel || 'First projected month'} />
      </div>
      <div className="explain-card stack-sm">
        <MetricRow label="Projection start" value={formatDate(parseLocalDate(draft.startDate))} />
        <MetricRow label="Monthly flex budget" value={currency.format(draft.monthlyDiscretionaryBudget)} />
        <MetricRow label="Recurring investment" value={`${currency.format(normalizeInvestmentModel(draft.investmentModel, draft.accounts, draft).recurringAmount)} on day ${normalizeInvestmentModel(draft.investmentModel, draft.accounts, draft).recurringDayOfMonth}`} />
        <MetricRow label="Budget compatibility" value={projection.budgetCompatible ? 'Fits' : 'Too tight'} />
        <MetricRow label="Safe monthly investing" value={currency.format(Math.max(0, projection.safeMonthlyInvestAmount))} />
      </div>
    </div>
  );
}

function Section({ title, children, summary = '', subtitle = '', collapsible = false, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (collapsible) {
    return (
      <section className={`section-block collapsible-section ${isOpen ? 'is-open' : ''}`}>
        <button type="button" className="section-toggle" onClick={() => setIsOpen((current) => !current)}>
          <div className="section-toggle-copy">
            <span className="section-toggle-title">{title}</span>
            {summary ? <span className="section-toggle-summary">{summary}</span> : null}
            {subtitle ? <span className="section-caption">{subtitle}</span> : null}
          </div>
        </button>
        {isOpen ? <div className="section-body">{children}</div> : null}
      </section>
    );
  }

  return (
    <section className="section-block">
      <div className="section-top">
        <div>
          <h2 style={{ fontSize: '0.93rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h2>
          {subtitle ? <span className="section-caption">{subtitle}</span> : null}
        </div>
        {summary ? <span className="pill neutral">{summary}</span> : null}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

function Label({ children, hint = '' }) {
  const [labelNode, ...inputNodes] = React.Children.toArray(children);
  return (
    <label className="field">
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--soft)', letterSpacing: '0.01em' }}>{labelNode}</span>
      {inputNodes}
      {hint ? <span className="input-hint">{hint}</span> : null}
    </label>
  );
}

function NumericInput({
  value,
  onValueChange,
  integer = false,
  allowNegative = false,
  sanitize = (next) => next,
  ...props
}) {
  const [text, setText] = useState(() => formatEditableNumber(value, integer));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setText(formatEditableNumber(value, integer));
    }
  }, [value, integer, isFocused]);

  const pattern = integer
    ? allowNegative ? /^-?\d*$/ : /^\d*$/
    : allowNegative ? /^-?\d*(\.\d*)?$/ : /^\d*(\.\d*)?$/;

  const commit = (raw) => {
    const parsed = parseEditableNumber(raw, integer);
    const fallback = raw === '' ? 0 : Number(value) || 0;
    const next = sanitize(parsed === null ? fallback : parsed);
    onValueChange(next);
    setText(formatEditableNumber(next, integer));
  };

  return (
    <input
      {...props}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      value={text}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        commit(text);
      }}
      onChange={(event) => {
        const raw = event.target.value;
        if (!pattern.test(raw)) return;
        setText(raw);
        const parsed = parseEditableNumber(raw, integer);
        if (parsed !== null) {
          onValueChange(sanitize(parsed));
        }
      }}
    />
  );
}

function NullableNumericInput({
  value,
  onValueChange,
  integer = false,
  allowNegative = false,
  sanitize = (next) => next,
  placeholder = '',
  ...props
}) {
  const [text, setText] = useState(() => (value === null || value === undefined ? '' : formatEditableNumber(value, integer)));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setText(value === null || value === undefined ? '' : formatEditableNumber(value, integer));
    }
  }, [value, integer, isFocused]);

  const pattern = integer
    ? allowNegative ? /^-?\d*$/ : /^\d*$/
    : allowNegative ? /^-?\d*(\.\d*)?$/ : /^\d*(\.\d*)?$/;

  return (
    <input
      {...props}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      value={text}
      placeholder={placeholder}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        if (text === '') {
          onValueChange(null);
          return;
        }
        const parsed = parseEditableNumber(text, integer);
        const next = sanitize(parsed === null ? 0 : parsed);
        onValueChange(next);
        setText(formatEditableNumber(next, integer));
      }}
      onChange={(event) => {
        const raw = event.target.value;
        if (!pattern.test(raw)) return;
        setText(raw);
        if (raw === '') {
          onValueChange(null);
          return;
        }
        const parsed = parseEditableNumber(raw, integer);
        if (parsed !== null) {
          onValueChange(sanitize(parsed));
        }
      }}
    />
  );
}

function AccountsList({ accounts, onAdd, onChange, onDelete, addLabel = 'Add account', collapsible = false, defaultOpen = true }) {
  const cashAccounts = getCashAccounts(accounts);
  const investmentAccounts = getInvestmentAccounts(accounts);
  return (
    <Section
      title={`Accounts (${accounts.length})`}
      summary={`${cashAccounts.length} cash · ${investmentAccounts.length} investment`}
      subtitle="Cash accounts drive spending and bill timing. Investment accounts power net-worth tracking and can receive brokerage or retirement contributions."
      collapsible={collapsible}
      defaultOpen={defaultOpen}
    >
      <div className="stack">
        {accounts.map((account) => (
          <div key={account.id} className="item-card tight">
            <div className="row-2">
              <Label>
                Account name
                <input value={account.name} onChange={(e) => onChange(account.id, { name: e.target.value })} />
              </Label>
              <Label>
                Account type
                <select
                  value={account.accountType}
                  onChange={(e) =>
                    onChange(account.id, {
                      accountType: normalizeAccountType(e.target.value),
                      investmentSubtype: e.target.value === 'investment' ? normalizeInvestmentSubtype(account.investmentSubtype) : '',
                    })}
                >
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Label>
            </div>
            <div className="row-2">
              <Label>
                Current balance
                <NumericInput value={account.balance} onValueChange={(next) => onChange(account.id, { balance: Math.max(0, next) })} />
              </Label>
              {account.accountType === 'investment' ? (
                <Label>
                  Investment subtype
                  <select
                    value={account.investmentSubtype}
                    onChange={(e) => onChange(account.id, { investmentSubtype: normalizeInvestmentSubtype(e.target.value) })}
                  >
                    {INVESTMENT_SUBTYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Label>
              ) : (
                <div />
              )}
            </div>
            <div className="item-footer">
              <span className={account.accountType === 'cash' ? 'pill neutral' : 'pill outline'}>
                {account.accountType === 'cash' ? 'Included in cash balance' : `Included in net worth as ${getInvestmentSubtypeLabel(account.investmentSubtype)}`}
              </span>
              <button className="ghost-button" onClick={() => onDelete(account.id)} disabled={accounts.length === 1 || (account.accountType === 'cash' && cashAccounts.length === 1)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="secondary-button" onClick={onAdd}>{addLabel}</button>
    </Section>
  );
}

function RecurringList({
  accounts = [],
  title,
  items,
  onAdd,
  onChange,
  onDelete,
  income = false,
  addLabel = 'Add item',
  collapsible = false,
  defaultOpen = true,
}) {
  const monthlyTotal = items.reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0);
  const resolvedAccounts = getCashAccounts(accounts);
  return (
    <Section
      title={title}
      summary={`${items.length} item${items.length === 1 ? '' : 's'} · ${currency.format(monthlyTotal)}`}
      subtitle={income ? 'Recurring deposits into a specific cash account.' : 'Bills that pull directly from a specific bank account.'}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
    >
      <div className="stack">
        {items.map((item) => (
          <div key={item.id} className="item-card tight">
            <Label>
              Name
              <input value={item.name} onChange={(e) => onChange(item.id, { name: e.target.value })} />
            </Label>
            <div className="row-2">
              <Label>
                Amount
                <NumericInput value={item.amount} onValueChange={(next) => onChange(item.id, { amount: Math.max(0, next) })} />
              </Label>
              <Label>
                Day of month
                <NumericInput value={item.dayOfMonth} integer sanitize={clampDay} onValueChange={(next) => onChange(item.id, { dayOfMonth: next })} />
              </Label>
            </div>
            <Label hint={income ? 'Choose which account this paycheck lands in.' : 'Choose which bank account this withdrawal leaves from.'}>
              {income ? 'Deposit into account' : 'Withdraw from account'}
              <select
                value={resolveCashAccountId(item.accountId, resolvedAccounts)}
                onChange={(e) => onChange(item.id, { accountId: e.target.value })}
              >
                {resolvedAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Label>
            <div className="item-footer">
              <span className={income ? 'pill positive' : 'pill neutral'}>
                {income ? `Lands in ${getAccountNameById(resolvedAccounts, item.accountId)}` : `Pulls from ${getAccountNameById(resolvedAccounts, item.accountId)}`}
              </span>
              <button className="ghost-button" onClick={() => onDelete(item.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <button className="secondary-button" onClick={onAdd}>{addLabel}</button>
    </Section>
  );
}

function PaycheckKeepScheduleEditor({ form, setForm, collapsible = true, defaultOpen = false }) {
  const projectedMonths = buildMonthOfYearConfigs();
  const customMonthCount = projectedMonths.filter((month) => getPaycheckKeepRate(form.paycheckKeepSchedule, month.key) !== 100).length;

  return (
    <Section
      title="Monthly paycheck kept"
      summary={customMonthCount ? `${customMonthCount} custom month${customMonthCount === 1 ? '' : 's'}` : 'All months at 100%'}
      subtitle="Set how much of each paycheck you actually keep in each month of the year after 401(k) or similar deductions."
      collapsible={collapsible}
      defaultOpen={defaultOpen}
    >
      <p className="section-note">This applies to every paycheck landing in that month of each projected year. Use 100% when your saved paycheck amount already matches take-home cash.</p>
      <div className="stack">
        {projectedMonths.map((month) => {
          const keepRate = getPaycheckKeepRate(form.paycheckKeepSchedule, month.key);
          return (
            <div key={month.key} className="item-card tight">
              <div className="item-footer no-margin">
                <strong>{month.label}</strong>
                <span className={keepRate === 100 ? 'pill neutral' : 'pill outline'}>{keepRate}% kept</span>
              </div>
              <Label hint="100 means keep the full saved paycheck amount. 85 means only 85% of each paycheck in that month lands in cash.">
                Percent of paycheck kept
                <NumericInput
                  value={keepRate}
                  integer
                  sanitize={clampPercentage}
                  onValueChange={(next) =>
                    setForm((current) => ({
                      ...current,
                      paycheckKeepSchedule: updatePaycheckKeepSchedule(current.paycheckKeepSchedule, month.key, next),
                    }))
                  }
                />
              </Label>
            </div>
          );
        })}
      </div>
      <button
        className="ghost-button"
        onClick={() => setForm((current) => ({ ...current, paycheckKeepSchedule: {} }))}
        disabled={customMonthCount === 0}
      >
        Reset all months to 100%
      </button>
    </Section>
  );
}

function CreditCardList({ form, setForm, collapsible = false, defaultOpen = true }) {
  const resolvedAccounts = getCashAccounts(form.accounts);
  const updateCard = (id, patch) => {
    setForm((current) => ({
      ...current,
      creditCards: current.creditCards.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const removeCard = (id) => {
    setForm((current) => ({
      ...current,
      creditCards: current.creditCards.filter((item) => item.id !== id),
    }));
  };

  const currentDueTotal = form.creditCards.reduce((sum, card) => sum + Math.abs(Number(card.currentBalance) || 0), 0);
  const accruedTotal = form.creditCards.reduce((sum, card) => sum + Math.abs(Number(card.accruedBalance) || 0), 0);

  return (
    <Section
      title={`Credit cards (${form.creditCards.length})`}
      summary={`${currency.format(currentDueTotal)} next due · ${currency.format(accruedTotal)} in flight`}
      subtitle="Split what is due on the very next due date from charges due one cycle later, and choose which bank account each autopay pulls from."
      collapsible={collapsible}
      defaultOpen={defaultOpen}
    >
      <div className="stack">
        {form.creditCards.map((card) => (
          <div key={card.id} className="item-card">
            <Label>
              Card name
              <input value={card.name} onChange={(e) => updateCard(card.id, { name: e.target.value })} />
            </Label>
            <div className="row-2">
              <Label hint="This is the statement balance that will hit on the next due date.">
                Statement balance due next
                <NumericInput value={card.currentBalance} onValueChange={(next) => updateCard(card.id, { currentBalance: Math.max(0, next) })} />
              </Label>
              <Label>
                Next due date
                <input type="date" value={card.nextDueDate} onChange={(e) => updateCard(card.id, { nextDueDate: e.target.value })} />
              </Label>
            </div>
            <div className="row-3">
              <Label hint="Charges made after the last statement closed. These are due one month after the next due date.">
                Accrued since statement close
                <NumericInput value={card.accruedBalance} onValueChange={(next) => updateCard(card.id, { accruedBalance: Math.max(0, next) })} />
              </Label>
              <Label hint="Used as the recurring statement payment estimate after the accrued balance is paid off.">
                Typical later statement
                <NumericInput value={card.monthlySpend} onValueChange={(next) => updateCard(card.id, { monthlySpend: Math.max(0, next) })} />
              </Label>
              <Label hint="The statement close day that determines which month of spend becomes due next.">
                Statement day
                <NumericInput value={card.statementDay} integer sanitize={clampDay} onValueChange={(next) => updateCard(card.id, { statementDay: next })} />
              </Label>
            </div>
            <div className="row-2">
              <Label hint="Used to label and align the future card-payment cadence.">
                Due day
                <NumericInput value={card.dueDay} integer sanitize={clampDay} onValueChange={(next) => updateCard(card.id, { dueDay: next })} />
              </Label>
              <Label hint="This is the specific configured cash account the card autopay will leave from.">
                Withdraw from account
                <select
                  value={resolveAccountId(card.paymentAccountId, resolvedAccounts)}
                  onChange={(e) => updateCard(card.id, { paymentAccountId: e.target.value })}
                >
                  {resolvedAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </Label>
            </div>
            <div className="row-2">
              <div className="stack-sm">
                <p className="section-note">
                  Next due: {currency.format(card.currentBalance || 0)} on {isIsoDate(card.nextDueDate) ? formatDate(parseLocalDate(card.nextDueDate)) : '—'}.
                </p>
                <p className="section-note no-bottom">
                  One cycle later: {currency.format(card.accruedBalance || 0)} before the ongoing {currency.format(card.monthlySpend || 0)} estimate takes over.
                </p>
              </div>
              <div className="stack-sm">
                <p className="section-note">
                  Autopay source: {getAccountNameById(resolvedAccounts, card.paymentAccountId)}.
                </p>
                <p className="section-note no-bottom">
                  The chart now flags if this specific account would go negative, even when your total cash still looks fine.
                </p>
              </div>
            </div>
            <div className="item-footer">
              <span className="pill warning">Modeled as next due, in-flight float, then recurring statement payments</span>
              <button className="ghost-button" onClick={() => removeCard(card.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <button
        className="secondary-button"
        onClick={() =>
          setForm((current) => ({
            ...current,
            creditCards: [...current.creditCards, createCard(current.creditCards.length + 1, current.accounts[0]?.id || '')],
          }))
        }
      >
        Add credit card
      </button>
    </Section>
  );
}

function MiniInfo({ label, value, caption }) {
  return (
    <div className="summary-card mini">
      <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--dim)' }}>{label}</span>
      <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
      <small style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>{caption}</small>
    </div>
  );
}

function EventList({ events, rangeStart, rangeEnd }) {
  const hasRange = Boolean(rangeStart && rangeEnd);
  const safeRangeStart = hasRange ? rangeStart : new Date();
  const safeRangeEnd = hasRange ? rangeEnd : safeRangeStart;
  const months = useMemo(() => buildCalendarMonths(safeRangeStart, safeRangeEnd), [safeRangeStart.getTime(), safeRangeEnd.getTime()]);
  const eventsByDay = useMemo(() => {
    const grouped = new Map();
    for (const event of events) {
      const key = toISODate(event.date);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(event);
    }
    return grouped;
  }, [events]);
  const firstEventDayKey = events.length ? toISODate(events[0].date) : toISODate(safeRangeStart);
  const preferredMonthIndex = useMemo(() => {
    const matchIndex = months.findIndex((month) => month.days.some((day) => day && day.key === firstEventDayKey));
    return matchIndex >= 0 ? matchIndex : 0;
  }, [months, firstEventDayKey]);
  const [selectedDayKey, setSelectedDayKey] = useState(firstEventDayKey);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(preferredMonthIndex);

  useEffect(() => {
    if (!months.length) return;
    setCurrentMonthIndex((current) => {
      if (current < 0 || current >= months.length) return preferredMonthIndex;
      return current;
    });
  }, [months, preferredMonthIndex]);

  const currentMonth = months[currentMonthIndex] || null;

  const getDefaultDayKeyForMonth = (month, preferredKey = selectedDayKey) => {
    if (!month) return firstEventDayKey;
    const monthDayKeys = month.days.filter(Boolean).map((day) => day.key);
    if (preferredKey && monthDayKeys.includes(preferredKey)) return preferredKey;
    const firstEventDayInMonth = monthDayKeys.find((key) => (eventsByDay.get(key) || []).length > 0);
    return firstEventDayInMonth || monthDayKeys[0] || firstEventDayKey;
  };

  useEffect(() => {
    if (!currentMonth) return;
    const nextDayKey = getDefaultDayKeyForMonth(currentMonth);
    if (nextDayKey !== selectedDayKey) {
      setSelectedDayKey(nextDayKey);
    }
  }, [currentMonth, selectedDayKey, eventsByDay, firstEventDayKey]);

  useEffect(() => {
    const hasSelectedMonth = months.some((month) => month.days.some((day) => day && day.key === selectedDayKey));
    if (!hasSelectedMonth && months.length) {
      setSelectedDayKey(firstEventDayKey);
    }
  }, [months, selectedDayKey, firstEventDayKey]);

  const visibleKinds = CALENDAR_EVENT_KIND_ORDER.filter((kind) => events.some((event) => event.type === kind));

  if (!hasRange) return <p className="muted">No events in range.</p>;
  if (!currentMonth) return <p className="muted">No events in range.</p>;

  const monthEventCount = currentMonth.days.reduce((sum, day) => sum + ((day && eventsByDay.get(day.key)?.length) || 0), 0);
  const selectedDay = currentMonth.days.find((day) => day && day.key === selectedDayKey) || null;
  const selectedDayEvents = selectedDay ? eventsByDay.get(selectedDay.key) || [] : [];
  const changeMonth = (direction) => {
    const nextIndex = Math.min(months.length - 1, Math.max(0, currentMonthIndex + direction));
    if (nextIndex === currentMonthIndex) return;
    const nextMonth = months[nextIndex];
    setCurrentMonthIndex(nextIndex);
    setSelectedDayKey(getDefaultDayKeyForMonth(nextMonth, null));
  };

  return (
    <div className="calendar-stack">
      {visibleKinds.length ? (
        <div className="calendar-legend">
          {visibleKinds.map((kind) => {
            const meta = getCalendarEventKindMeta(kind);
            return (
              <div className={`calendar-legend-item calendar-kind-${kind}`} key={kind}>
                <span className="calendar-legend-dot" />
                <span>{meta.label}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      <section className="calendar-month">
        <div className="calendar-month-header">
          <div>
            <h3>{currentMonth.label}</h3>
            <span className="muted tiny">{monthEventCount} scheduled event{monthEventCount === 1 ? '' : 's'}</span>
          </div>
          <div className="calendar-nav">
            <button
              type="button"
              className="ghost-button"
              onClick={() => changeMonth(-1)}
              disabled={currentMonthIndex === 0}
            >
              Previous
            </button>
            <span className="calendar-nav-status">{currentMonthIndex + 1} / {months.length}</span>
            <button
              type="button"
              className="ghost-button"
              onClick={() => changeMonth(1)}
              disabled={currentMonthIndex === months.length - 1}
            >
              Next
            </button>
          </div>
        </div>

        <div className="calendar-weekdays">
          {CALENDAR_WEEKDAY_LABELS.map((label) => (
            <span key={`${currentMonth.key}-${label}`}>{label}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {currentMonth.days.map((day, index) => {
            if (!day) return <div className="calendar-day-spacer" key={`${currentMonth.key}-spacer-${index}`} aria-hidden="true" />;

            const dayEvents = eventsByDay.get(day.key) || [];
            const markers = summarizeCalendarDayKinds(dayEvents);
            const previewEvent = dayEvents[0];

            return (
              <button
                type="button"
                key={day.key}
                className={`calendar-day ${dayEvents.length ? '' : 'is-empty'} ${selectedDayKey === day.key ? 'selected' : ''}`.trim()}
                onClick={() => setSelectedDayKey(day.key)}
              >
                <div className="calendar-day-top">
                  <span className="calendar-day-number">{day.date.getDate()}</span>
                  <span className="calendar-day-count">{dayEvents.length ? `${dayEvents.length} evt` : ''}</span>
                </div>

                <div className="calendar-marker-row">
                  {markers.map((marker) => (
                    <span className={`calendar-marker calendar-kind-${marker.kind}`} key={`${day.key}-${marker.kind}`}>
                      <span className="calendar-marker-dot" />
                      <span>{marker.shortLabel}</span>
                    </span>
                  ))}
                </div>

                {previewEvent ? (
                  <div className="calendar-day-preview">
                    <strong>{previewEvent.label}</strong>
                    {dayEvents.length > 1 ? ` +${dayEvents.length - 1} more` : ''}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        {selectedDay && selectedDayEvents.length ? (
          <div className="calendar-detail">
            <div className="calendar-detail-header">
              <h4>{formatDate(selectedDay.date)}</h4>
              <span className="muted tiny">{selectedDayEvents.length} event{selectedDayEvents.length === 1 ? '' : 's'}</span>
            </div>
            <div className="calendar-detail-list">
              {selectedDayEvents.map((event, index) => (
                <div className="calendar-detail-event" key={`${event.label}-${index}-${event.date.toISOString()}`}>
                  <div className="calendar-detail-main">
                    <div className="event-meta-row">
                      <strong>{event.label}</strong>
                      <span className={`calendar-marker calendar-kind-${event.type}`}>
                        <span className="calendar-marker-dot" />
                        <span>{getCalendarEventKindMeta(event.type).label}</span>
                      </span>
                      {event.cardPhase ? <span className="pill outline">{cardPhaseLabel(event.cardPhase)}</span> : null}
                      {event.accountName ? <span className="pill neutral">{event.accountName}</span> : null}
                    </div>
                    <div className="muted tiny">{formatDate(event.date)}</div>
                  </div>
                  <div className="calendar-detail-side">
                    <div className={event.amount >= 0 ? 'amount positive-text' : 'amount negative-text'}>
                      {event.amount >= 0 ? '+' : '-'}{currency.format(Math.abs(event.amount))}
                    </div>
                    <div className="muted tiny">
                      Bal: {currency.format(event.runningBalance)}
                      {event.accountBalanceAfterEvent !== undefined ? ` · ${event.accountName}: ${currency.format(event.accountBalanceAfterEvent)}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function MonthlyBudgetList({ summaries }) {
  if (!summaries.length) return <p className="muted">No monthly summary yet.</p>;

  const showInvestmentRow = summaries.some((month) => month.investments > 0);
  const showRetirementRow = summaries.some((month) => month.retirementContributions > 0);
  const rows = [
    { label: 'Income', getValue: (month) => currency.format(month.income) },
    { label: 'Bank withdrawals', getValue: (month) => currency.format(month.bankExpenses) },
    { label: 'Card payments due', getValue: (month) => currency.format(month.cardPayments) },
    ...(showInvestmentRow ? [{ label: 'Brokerage investing', getValue: (month) => currency.format(month.investments) }] : []),
    ...(showRetirementRow ? [{ label: '401(k) funded', getValue: (month) => currency.format(month.retirementContributions) }] : []),
    { label: 'Free after obligations', getValue: (month) => currency.format(month.availableForBudget) },
    { label: 'Your flex budget', getValue: (month) => currency.format(month.discretionaryBudget) },
    {
      label: 'Left after budget',
      getValue: (month) => currency.format(month.afterBudget),
      getClassName: (month) => (month.afterBudget >= 0 ? 'positive-text' : 'negative-text'),
    },
  ];

  return (
    <div className="budget-table-shell">
      <table className="budget-table">
        <thead>
          <tr>
            <th scope="col">Metric</th>
            {summaries.map((month) => (
              <th key={month.key} scope="col">
                <div className="budget-table-month">
                  <strong>{month.monthLabel}</strong>
                  <span className={month.afterBudget >= 0 ? 'pill positive' : 'pill warning'}>
                    {month.afterBudget >= 0 ? 'Budget fits' : 'Over budget'}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {summaries.map((month) => (
                <td key={`${month.key}-${row.label}`}>
                  <span className={`budget-table-value ${row.getClassName?.(month) ?? ''}`.trim()}>
                    {row.getValue(month)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricRow({ label, value, subtle = false }) {
  const isNegative = typeof value === 'string' && value.startsWith('-');
  return (
    <div className={`metric-row ${subtle ? 'metric-row-subtle' : ''}`}>
      <span style={{ fontSize: subtle ? '0.8rem' : '0.85rem', color: 'var(--muted)' }}>{label}</span>
      <strong style={{ fontSize: subtle ? '0.85rem' : '0.9rem', color: isNegative ? 'var(--danger)' : subtle ? 'var(--soft)' : 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{value}</strong>
    </div>
  );
}

const EVENT_MARKER_COLORS = {
  income: 'var(--green)',
  expense: 'var(--danger)',
  'card-payment': 'var(--warning)',
  investment: 'var(--primary-3)',
};

const CHART_WINDOW_MONTHS = { '1m': 1, '3m': 3, '6m': 6, '1y': 12, '2y': 24 };

function fmtAxis(v) {
  const abs = Math.abs(v);
  const neg = v < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${neg}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1_000) return `${neg}$${Math.round(abs / 1e3)}K`;
  return `${neg}$${Math.round(abs)}`;
}

function BalanceChart({ timeline, reserveTarget, events, accountTimelines = [], chartLabel = 'Balance', showReserve = true }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredEventKey, setHoveredEventKey] = useState(null);
  const [visibleEventTypes, setVisibleEventTypes] = useState({
    income: false,
    expense: false,
    'card-payment': false,
    investment: false,
  });
  const width = 1600;
  const height = 300;
  const margin = { top: 22, right: 24, bottom: 44, left: 58 };
  const safeTimeline = timeline.length ? timeline : [{ date: new Date(), balance: 0 }];
  const chartEvents = Array.isArray(events) ? events : [];
  const visibleChartEvents = chartEvents.filter((event) => visibleEventTypes[event.type]);
  const visibleAccountTimelines = Array.isArray(accountTimelines) ? accountTimelines : [];
  const reserveReference = showReserve ? reserveTarget : 0;
  const balanceValues = [
    ...safeTimeline.map((p) => p.balance),
    ...visibleAccountTimelines.flatMap((a) => a.points.map((p) => p.balance)),
  ];
  const yTicks = buildBalanceAxisTicks(Math.min(...balanceValues, reserveReference, 0), Math.max(...balanceValues, reserveReference, 0), 5);
  const minBalance = yTicks[0] ?? Math.min(...balanceValues, reserveReference, 0);
  const maxBalance = yTicks.at(-1) ?? Math.max(...balanceValues, reserveReference, 0);
  const range = Math.max(1, maxBalance - minBalance);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const plotBottom = margin.top + chartHeight;
  const plotRight = margin.left + chartWidth;
  const toX = (index) => margin.left + (index / Math.max(1, safeTimeline.length - 1)) * chartWidth;
  const toY = (balance) => margin.top + ((maxBalance - balance) / range) * chartHeight;

  const linePoints = safeTimeline.map((point, index) => ({ x: toX(index), y: toY(point.balance), ...point }));
  const points = linePoints.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = [`${margin.left},${plotBottom}`, ...linePoints.map((p) => `${p.x},${p.y}`), `${plotRight},${plotBottom}`].join(' ');
  const zeroY = minBalance <= 0 && maxBalance >= 0 ? toY(0) : null;
  const reserveY = toY(reserveReference);
  const final = safeTimeline.at(-1);
  const xTicks = buildMonthAxisTicks(safeTimeline, toX);
  const timelineIndexByDay = new Map(safeTimeline.map((point, index) => [toISODate(point.date), index]));
  const accountLineSeries = visibleAccountTimelines.map((account, index) => ({
    ...account,
    color: getChartAccountColor(index),
    svgPoints: account.points.map((point, pi) => `${toX(pi)},${toY(point.balance)}`).join(' '),
  }));
  const eventPoints = visibleChartEvents
    .map((event, index) => {
      const timelineIndex = timelineIndexByDay.get(toISODate(event.date));
      if (timelineIndex === undefined) return null;
      return {
        ...event,
        key: `${event.label}-${index}-${event.date.toISOString()}`,
        x: toX(timelineIndex),
        lineBalance: safeTimeline[timelineIndex].balance,
        y: toY(safeTimeline[timelineIndex].balance),
      };
    })
    .filter(Boolean);
  const hoveredPoint = hoveredIndex === null ? null : linePoints[hoveredIndex];
  const hoveredEvent = hoveredEventKey ? eventPoints.find((e) => e.key === hoveredEventKey) : null;
  const emphasizedAccountId = hoveredEvent?.accountId || hoveredPoint?.lowestAccountId || '';
  const hoveredDayEvents = hoveredPoint ? visibleChartEvents.filter((e) => toISODate(e.date) === toISODate(hoveredPoint.date)) : [];
  const hoveredAccountBalances = hoveredEvent?.accountBalances || hoveredPoint?.accountBalances || null;
  const toggleEventType = (type) =>
    setVisibleEventTypes((current) => ({ ...current, [type]: !current[type] }));
  const markerToggleItems = [
    {
      type: 'income',
      label: 'Income',
      icon: <svg width="11" height="10" viewBox="0 0 11 10" style={{ flex: 'none' }} aria-hidden="true"><polygon points="5.5,0.5 0.5,9.5 10.5,9.5" fill="var(--green)" /></svg>,
    },
    {
      type: 'expense',
      label: 'Expense',
      icon: <svg width="10" height="10" viewBox="0 0 10 10" style={{ flex: 'none' }} aria-hidden="true"><circle cx="5" cy="5" r="4.5" fill="var(--danger)" /></svg>,
    },
    {
      type: 'card-payment',
      label: 'Card payment',
      icon: <svg width="10" height="10" viewBox="0 0 10 10" style={{ flex: 'none' }} aria-hidden="true"><polygon points="5,0.5 9.5,5 5,9.5 0.5,5" fill="var(--warning)" /></svg>,
    },
    {
      type: 'investment',
      label: 'Investment',
      icon: <svg width="9" height="9" viewBox="0 0 9 9" style={{ flex: 'none' }} aria-hidden="true"><rect x="0.5" y="0.5" width="8" height="8" rx="1.5" fill="var(--primary-3)" /></svg>,
    },
  ];

  const handleHoverMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / Math.max(1, rect.width)));
    setHoveredIndex(Math.round(ratio * Math.max(0, safeTimeline.length - 1)));
    setHoveredEventKey(null);
  };

  const activeTooltipPoint = hoveredEvent
    ? { x: hoveredEvent.x, y: hoveredEvent.y }
    : hoveredPoint
      ? { x: hoveredPoint.x, y: hoveredPoint.y }
      : null;
  const tooltipWidth = hoveredEvent ? 252 : 178;
  const tooltipHeight = hoveredEvent
    ? (hoveredEvent.accountName ? 96 : 76)
    : (hoveredDayEvents.length > 0 ? 62 : 48);
  const tooltipPadL = hoveredEvent ? 18 : 12;
  const tooltipPlacementX = activeTooltipPoint
    ? Math.max(margin.left + 8, Math.min(plotRight - tooltipWidth, activeTooltipPoint.x + 14 > plotRight - tooltipWidth + 12 ? activeTooltipPoint.x - tooltipWidth - 8 : activeTooltipPoint.x + 12))
    : margin.left + 12;
  const tooltipPlacementY = activeTooltipPoint
    ? Math.max(margin.top + 8, activeTooltipPoint.y - (hoveredEvent ? 80 : 52))
    : margin.top + 8;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img" aria-label={`${chartLabel} projection chart`}>
        <defs>
          <linearGradient id="balanceLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#73a7ff" />
            <stop offset="50%" stopColor="#8dbeff" />
            <stop offset="100%" stopColor="#59f0de" />
          </linearGradient>
          <linearGradient id="balanceAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(115,167,255,0.38)" />
            <stop offset="65%" stopColor="rgba(89,240,222,0.06)" />
            <stop offset="100%" stopColor="rgba(89,240,222,0)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} rx="18" className="chart-bg" />
        {/* Horizontal grid lines + y-axis labels */}
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line x1={margin.left} x2={plotRight} y1={toY(tick)} y2={toY(tick)} className="chart-grid-line" />
            <text x={margin.left - 9} y={toY(tick) + 4} textAnchor="end" className="chart-axis-label">
              {fmtAxis(tick)}
            </text>
          </g>
        ))}
        {/* X-axis tick marks + labels (no vertical grid lines) */}
        {xTicks.map((tick) => (
          <g key={`x-${tick.key}`}>
            <line x1={tick.x} x2={tick.x} y1={plotBottom} y2={plotBottom + 5} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <text x={tick.x} y={plotBottom + 18} textAnchor="middle" className="chart-axis-label">
              {tick.label}
            </text>
          </g>
        ))}
        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={plotBottom} className="chart-axis-line" />
        <line x1={margin.left} x2={plotRight} y1={plotBottom} y2={plotBottom} className="chart-axis-line" />
        <text x={16} y={18} className="chart-axis-title">{chartLabel}</text>
        <text x={plotRight} y={height - 8} textAnchor="end" className="chart-axis-title">Month</text>
        {/* Risk bands */}
        {showReserve ? <rect x={margin.left} y={margin.top} width={chartWidth} height={Math.max(0, reserveY - margin.top)} className="chart-band-safe" /> : null}
        {showReserve ? <rect x={margin.left} y={reserveY} width={chartWidth} height={Math.max(0, toY(0) - reserveY)} className="chart-band-caution" /> : null}
        {showReserve && zeroY !== null && zeroY > reserveY ? <rect x={margin.left} y={zeroY} width={chartWidth} height={plotBottom - zeroY} className="chart-band-danger" /> : null}
        {zeroY !== null && <line x1={margin.left} x2={plotRight} y1={zeroY} y2={zeroY} className="zero-line" />}
        {showReserve ? <line x1={margin.left} x2={plotRight} y1={reserveY} y2={reserveY} className="reserve-line" /> : null}
        {showReserve && reserveReference > 0 ? (
          <text x={plotRight - 6} y={reserveY - 5} textAnchor="end" style={{ fill: 'rgba(255,191,94,0.85)', fontSize: '9px', fontWeight: 700 }}>
            {fmtAxis(reserveReference)} reserve
          </text>
        ) : null}
        {/* Area fill */}
        <polyline points={areaPoints} className="chart-area" />
        {/* Per-account lines */}
        {accountLineSeries.length > 1
          ? accountLineSeries.map((account) => (
            <polyline
              key={account.id}
              points={account.svgPoints}
              className={`chart-account-line ${emphasizedAccountId === account.id ? 'hovered' : ''}`}
              style={{ stroke: account.color }}
            />
          ))
          : null}
        {/* Main balance line */}
        <polyline fill="none" points={points} className="balance-line" />
        {/* Hover vertical line + glowing dot */}
        {hoveredPoint ? (
          <g>
            <line x1={hoveredPoint.x} x2={hoveredPoint.x} y1={margin.top} y2={plotBottom} className="chart-hover-line" />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="13" fill="rgba(110,166,255,0.1)" />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="6" className="chart-hover-dot" />
          </g>
        ) : null}
        {/* Invisible hover capture rect */}
        <rect
          x={margin.left} y={margin.top} width={chartWidth} height={chartHeight}
          fill="transparent"
          onMouseMove={handleHoverMove}
          onMouseLeave={() => { setHoveredIndex(null); setHoveredEventKey(null); }}
        />
        {/* Shape-coded event markers */}
        {eventPoints.map((event) => {
          const isHovered = hoveredEvent?.key === event.key;
          const scale = isHovered ? 1.3 : 1;
          const cx = event.x;
          const cy = event.y;
          const atRisk = event.type === 'card-payment' && event.accountBalanceAfterEvent < 0;
          const edgeStroke = atRisk ? 'var(--danger)' : 'rgba(5,10,22,0.85)';
          const edgeWidth = atRisk ? 2.5 : 1.5;
          const handlers = {
            onMouseEnter: () => {
              setHoveredEventKey(event.key);
              const di = timelineIndexByDay.get(toISODate(event.date));
              if (di !== undefined) setHoveredIndex(di);
            },
            onMouseLeave: () => setHoveredEventKey(null),
            style: { cursor: 'pointer' },
          };
          if (event.type === 'income') {
            const s = 5.5 * scale;
            return <polygon key={event.key} points={`${cx},${cy - s * 1.1} ${cx - s},${cy + s * 0.75} ${cx + s},${cy + s * 0.75}`} fill={EVENT_MARKER_COLORS.income} stroke={edgeStroke} strokeWidth={edgeWidth} className="chart-event-point" {...handlers} />;
          }
          if (event.type === 'card-payment') {
            const s = 5.5 * scale;
            return <polygon key={event.key} points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`} fill={EVENT_MARKER_COLORS['card-payment']} stroke={edgeStroke} strokeWidth={edgeWidth} className="chart-event-point" {...handlers} />;
          }
          if (event.type === 'investment') {
            const s = 4.5 * scale;
            return <rect key={event.key} x={cx - s} y={cy - s} width={s * 2} height={s * 2} rx="2" fill={EVENT_MARKER_COLORS.investment} stroke={edgeStroke} strokeWidth={edgeWidth} className="chart-event-point" {...handlers} />;
          }
          const r = 5 * scale;
          return <circle key={event.key} cx={cx} cy={cy} r={r} fill={EVENT_MARKER_COLORS.expense} stroke={edgeStroke} strokeWidth={edgeWidth} className="chart-event-point" {...handlers} />;
        })}
        {/* Tooltip */}
        {activeTooltipPoint ? (
          <g>
            <rect x={tooltipPlacementX} y={tooltipPlacementY} width={tooltipWidth} height={tooltipHeight} rx="10" className="chart-tooltip-box" />
            {hoveredEvent ? (
              <rect x={tooltipPlacementX + 2} y={tooltipPlacementY + 5} width="4" height={tooltipHeight - 10} rx="3" fill={EVENT_MARKER_COLORS[hoveredEvent.type]} />
            ) : null}
            <text x={tooltipPlacementX + tooltipPadL} y={tooltipPlacementY + 16} className="chart-tooltip-date">
              {formatDate(hoveredEvent ? hoveredEvent.date : hoveredPoint.date)}
            </text>
            {hoveredEvent ? (
              <>
                <text x={tooltipPlacementX + tooltipPadL} y={tooltipPlacementY + 32} className="chart-tooltip-label">
                  {hoveredEvent.label}
                </text>
                <text x={tooltipPlacementX + tooltipPadL} y={tooltipPlacementY + 50} className="chart-tooltip-value" style={{ fill: EVENT_MARKER_COLORS[hoveredEvent.type] }}>
                  {hoveredEvent.amount >= 0 ? '+' : ''}{currency.format(hoveredEvent.amount)}  ·  {fmtAxis(hoveredEvent.lineBalance)}
                </text>
                {hoveredEvent.accountName ? (
                  <text x={tooltipPlacementX + tooltipPadL} y={tooltipPlacementY + 68} className="chart-tooltip-date">
                    {hoveredEvent.accountName} → {currency.format(hoveredEvent.accountBalanceAfterEvent)}
                  </text>
                ) : null}
              </>
            ) : (
              <>
                <text x={tooltipPlacementX + tooltipPadL} y={tooltipPlacementY + 34} className="chart-tooltip-value">
                  {currency.format(hoveredPoint.balance)}
                </text>
                {hoveredDayEvents.length > 0 ? (
                  <text x={tooltipPlacementX + tooltipPadL} y={tooltipPlacementY + 52} className="chart-tooltip-date" style={{ opacity: 0.7 }}>
                    {hoveredDayEvents.slice(0, 2).map((e) => e.label).join(' · ')}
                  </text>
                ) : null}
              </>
            )}
          </g>
        ) : null}
        {/* End-of-range dot */}
        {final ? (
          <>
            <circle cx={plotRight} cy={toY(final.balance)} r="8" fill="rgba(110,166,255,0.15)" />
            <circle cx={plotRight} cy={toY(final.balance)} r="4.5" className="chart-dot" />
          </>
        ) : null}
      </svg>
      <div className="chart-bottom">
        <div className="chart-legend-row">
          <span className="chart-legend-item">
            <span className="chart-legend-line" style={{ background: 'linear-gradient(90deg,#73a7ff,#59f0de)' }} />
            {chartLabel}
          </span>
          {markerToggleItems.map((item) => (
            <button
              key={item.type}
              type="button"
              className={`chart-legend-toggle ${visibleEventTypes[item.type] ? 'active' : ''}`}
              aria-pressed={visibleEventTypes[item.type]}
              onClick={() => toggleEventType(item.type)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          {showReserve && reserveReference > 0 ? (
            <span className="chart-legend-item">
              <svg width="14" height="3" viewBox="0 0 14 3" style={{ flex: 'none' }} aria-hidden="true">
                <line x1="0" y1="1.5" x2="14" y2="1.5" stroke="rgba(245,184,74,0.85)" strokeWidth="2" strokeDasharray="4 3" />
              </svg>
              Reserve
            </span>
          ) : null}
        </div>
        {(hoveredPoint || hoveredEvent) ? (
          <div className="chart-hover-card">
            <div className="chart-hover-card-item">
              <strong>{formatDate(hoveredEvent ? hoveredEvent.date : hoveredPoint.date)}</strong>
            </div>
            <div className="chart-hover-card-item">
              <span>Total</span>
              <strong>{currency.format(hoveredPoint?.balance ?? hoveredEvent?.lineBalance ?? 0)}</strong>
            </div>
            {hoveredEvent ? (
              <>
                <div className="chart-hover-card-item">
                  <span style={{ color: EVENT_MARKER_COLORS[hoveredEvent.type] }}>{hoveredEvent.label}</span>
                  <strong style={{ color: EVENT_MARKER_COLORS[hoveredEvent.type] }}>
                    {hoveredEvent.amount >= 0 ? '+' : ''}{currency.format(hoveredEvent.amount)}
                  </strong>
                </div>
                {hoveredEvent.accountName ? (
                  <div className="chart-hover-card-item">
                    <span>{hoveredEvent.accountName} after</span>
                    <strong>{currency.format(hoveredEvent.accountBalanceAfterEvent)}</strong>
                  </div>
                ) : null}
              </>
            ) : hoveredDayEvents.length > 0 ? (
              <div className="chart-hover-card-item">
                <span>{hoveredDayEvents.slice(0, 3).map((e) => e.label).join(' · ')}</span>
              </div>
            ) : null}
            {hoveredAccountBalances && accountLineSeries.length > 1
              ? accountLineSeries.map((acc) => (
                <div key={acc.id} className="chart-hover-card-item">
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: acc.color, flex: 'none', display: 'inline-block' }} />
                  <span>{acc.name}</span>
                  <strong>{currency.format(hoveredAccountBalances[acc.id] ?? 0)}</strong>
                </div>
              ))
              : null}
          </div>
        ) : null}
        {accountLineSeries.length > 1 ? (
          <div className="chart-account-legend">
            <span className="chart-account-chip">Solid: total {chartLabel.toLowerCase()}</span>
            {accountLineSeries.map((acc) => (
              <span key={acc.id} className="chart-account-chip">
                <span className="chart-account-swatch" style={{ background: acc.color }} />
                {acc.name} · min {currency.format(acc.minimumBalance)}
              </span>
            ))}
          </div>
        ) : null}
        {showReserve && accountLineSeries.length > 1 ? (
          <p style={{ fontSize: '0.71rem', color: 'var(--dim)', lineHeight: 1.5, margin: 0 }}>
            Dashed lines show individual account balances. Card-payment markers gain a red ring if the source account would go below zero.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function buildProjection(form) {
  const normalized = normalizePlan(form);
  const start = parseLocalDate(normalized.startDate);
  const end = addDays(addMonths(start, normalized.projectionYears * 12), -1);
  const accounts = normalized.accounts;
  const cashAccounts = getCashAccounts(accounts);
  const investmentAccounts = getInvestmentAccounts(accounts);
  const primaryAccountId = getPrimaryAccountId(cashAccounts);
  const incomeModel = normalizeIncomeModel(normalized.incomeModel, cashAccounts, normalized.paychecks, normalized.startDate);
  const investmentModel = normalizeInvestmentModel(normalized.investmentModel, accounts, normalized);
  const startingAllAccountBalances = snapshotAccountBalances(
    accounts,
    Object.fromEntries(accounts.map((account) => [account.id, Number(account.balance) || 0]))
  );
  const startingCashAccountBalances = snapshotAccountBalances(
    cashAccounts,
    Object.fromEntries(cashAccounts.map((account) => [account.id, Number(account.balance) || 0]))
  );
  const startingCash = sumAccountBalances(startingCashAccountBalances, cashAccounts);
  const events = [];
  const investmentEvents = [];
  const pushEvent = (event) => {
    const accountId = resolveCashAccountId(event.accountId || primaryAccountId, cashAccounts);
    events.push({
      ...event,
      accountId,
      accountName: getAccountNameById(cashAccounts, accountId),
    });
  };
  const depositAccountId = resolveCashAccountId(incomeModel.depositAccountId, cashAccounts);
  const yearlyTrackers = new Map();
  const payrollOccurrences = buildPayrollOccurrencesForRange(start, end, incomeModel);

  for (const occurrence of payrollOccurrences) {
    const year = occurrence.date.getFullYear();
    const settings = createIncomeYearSettings(getResolvedIncomeYearSettings(incomeModel, year));
    const tracker = yearlyTrackers.get(year) || createIncomeYearTracker();
    const breakdown = calculatePayrollOccurrence(settings, tracker, occurrence.kind);

    if (breakdown.gross <= 0) {
      yearlyTrackers.set(year, breakdown.nextTracker);
      continue;
    }

    yearlyTrackers.set(year, breakdown.nextTracker);

    pushEvent({
      date: occurrence.date,
      amount: breakdown.netCash,
      label: occurrence.kind === 'bonus' ? 'Annual bonus' : 'Salary paycheck',
      shortLabel: occurrence.kind === 'bonus' ? 'Bonus' : 'Pay',
      type: 'income',
      accountId: depositAccountId,
      grossAmount: breakdown.gross,
      taxAmount: breakdown.taxTotal,
      retirementContributionAmount: breakdown.totalRetirementContribution,
    });

    if (breakdown.totalRetirementContribution > 0) {
      investmentEvents.push({
        date: occurrence.date,
        accountId: resolveInvestmentAccountId(investmentModel.retirementAccountId, investmentAccounts),
        amount: breakdown.totalRetirementContribution,
      });
    }
  }

  for (const expense of normalized.recurringExpenses) {
    forEachMonth(start, end, (year, monthIndex) => {
      const date = makeClampedDate(year, monthIndex, expense.dayOfMonth);
      if (date >= start && date <= end) {
        const accountId = resolveCashAccountId(expense.accountId, cashAccounts);
        pushEvent({
          date,
          amount: -Math.abs(expense.amount),
          label: expense.name,
          type: 'expense',
          accountId,
        });
      }
    });
  }

  forEachMonth(start, end, (year, monthIndex) => {
    const monthDate = new Date(year, monthIndex, 1);
    const monthKey = monthKeyFromDate(monthDate);
    const monthPlan = getResolvedMonthPlanValues(normalized, monthKey);
    const recurringAmount = Math.max(0, Number(monthPlan.investmentAmount) || 0);
    const date = makeClampedDate(year, monthIndex, monthPlan.investmentDay);
    if (date >= start && date <= end) {
      if (recurringAmount <= 0) return;
      pushEvent({
        date,
        amount: -Math.abs(recurringAmount),
        label: 'Monthly brokerage investment',
        shortLabel: 'Invest',
        type: 'investment',
        accountId: resolveCashAccountId(investmentModel.sourceAccountId, cashAccounts),
      });
      investmentEvents.push({
        date,
        accountId: resolveInvestmentAccountId(investmentModel.destinationAccountId, investmentAccounts),
        amount: Math.abs(recurringAmount),
      });
    }
  });

  for (const card of normalized.creditCards) {
    const nextDueDate = parseLocalDate(card.nextDueDate);
    const nextCycleDueDate = shiftMonthKeepingDay(nextDueDate, 1);
    const nextStatementDate = inferStatementDateForDueDate(nextDueDate, card.statementDay, card.dueDay);
    const paymentAccountId = resolveCashAccountId(card.paymentAccountId, cashAccounts);
    const paymentAccountName = getAccountNameById(cashAccounts, paymentAccountId);

    if (nextDueDate >= start && nextDueDate <= end && Number(card.currentBalance) > 0) {
      pushEvent({
        date: nextDueDate,
        amount: -Math.abs(card.currentBalance),
        label: `${card.name} next statement balance due`,
        shortLabel: `${card.name} next due`,
        type: 'card-payment',
        cardPhase: 'current',
        accountId: paymentAccountId,
        accountName: paymentAccountName,
      });
    }

    if (nextCycleDueDate >= start && nextCycleDueDate <= end && Number(card.accruedBalance) > 0) {
      pushEvent({
        date: nextCycleDueDate,
        amount: -Math.abs(card.accruedBalance),
        label: `${card.name} charges since ${formatDate(nextStatementDate)} due`,
        shortLabel: `${card.name} in flight`,
        type: 'card-payment',
        cardPhase: 'accrued',
        accountId: paymentAccountId,
        accountName: paymentAccountName,
      });
    }

    const recurringStartOffset = Number(card.accruedBalance) > 0 ? 2 : 1;
    for (let offset = recurringStartOffset; ; offset += 1) {
      const dueDate = shiftMonthKeepingDay(nextDueDate, offset);
      if (dueDate > end) break;
      if (dueDate >= start && Number(card.monthlySpend) > 0) {
        const statementDate = inferStatementDateForDueDate(dueDate, card.statementDay, card.dueDay);
        pushEvent({
          date: dueDate,
          amount: -Math.abs(card.monthlySpend),
          label: `${card.name} estimated statement from ${formatDate(statementDate)} due`,
          shortLabel: `${card.name} est.`,
          type: 'card-payment',
          cardPhase: 'estimated',
          accountId: paymentAccountId,
          accountName: paymentAccountName,
        });
      }
    }
  }

  events.sort((a, b) => a.date - b.date || a.amount - b.amount);
  investmentEvents.sort((a, b) => a.date - b.date || (a.amount || 0) - (b.amount || 0));

  const runningCashAccountBalances = { ...startingCashAccountBalances };
  const eventRows = events.map((event) => {
    runningCashAccountBalances[event.accountId] = (Number(runningCashAccountBalances[event.accountId]) || 0) + event.amount;
    const accountBalances = snapshotAccountBalances(cashAccounts, runningCashAccountBalances);
    const lowestAccount = getLowestAccountEntry(cashAccounts, accountBalances);
    return {
      ...event,
      runningBalance: sumAccountBalances(accountBalances, cashAccounts),
      accountBalances,
      accountBalanceAfterEvent: accountBalances[event.accountId] ?? 0,
      lowestAccountId: lowestAccount.id,
      lowestAccountName: lowestAccount.name,
      lowestAccountBalance: lowestAccount.balance,
    };
  });

  const timeline = [];
  let cursor = new Date(start);
  let balance = startingCash;
  let currentCashAccountBalances = { ...startingCashAccountBalances };
  let currentAllAccountBalances = { ...startingAllAccountBalances };
  let currentLowestAccount = getLowestAccountEntry(cashAccounts, currentCashAccountBalances);
  let eventIndex = 0;
  let investmentEventIndex = 0;
  const dailyReturnFactor = Math.pow(1 + (Number(investmentModel.annualReturnRate) || 0) / 100, 1 / 365);

  while (cursor <= end) {
    if (timeline.length) {
      for (const account of investmentAccounts) {
        currentAllAccountBalances[account.id] = (Number(currentAllAccountBalances[account.id]) || 0) * dailyReturnFactor;
      }
    }
    const dayKey = toISODate(cursor);
    while (eventIndex < eventRows.length && toISODate(eventRows[eventIndex].date) === dayKey) {
      balance = eventRows[eventIndex].runningBalance;
      currentCashAccountBalances = eventRows[eventIndex].accountBalances;
      currentAllAccountBalances = {
        ...currentAllAccountBalances,
        ...eventRows[eventIndex].accountBalances,
      };
      currentLowestAccount = {
        id: eventRows[eventIndex].lowestAccountId,
        name: eventRows[eventIndex].lowestAccountName,
        balance: eventRows[eventIndex].lowestAccountBalance,
      };
      eventIndex += 1;
    }
    while (investmentEventIndex < investmentEvents.length && toISODate(investmentEvents[investmentEventIndex].date) === dayKey) {
      const investmentAccountId = resolveInvestmentAccountId(investmentEvents[investmentEventIndex].accountId, investmentAccounts);
      if (investmentAccountId) {
        currentAllAccountBalances[investmentAccountId] = (Number(currentAllAccountBalances[investmentAccountId]) || 0) + (Number(investmentEvents[investmentEventIndex].amount) || 0);
      }
      investmentEventIndex += 1;
    }
    const totalInvestedBalance = sumAccountBalances(currentAllAccountBalances, investmentAccounts);
    timeline.push({
      date: new Date(cursor),
      balance,
      investedBalance: totalInvestedBalance,
      netWorth: balance + totalInvestedBalance,
      accountBalances: currentCashAccountBalances,
      allAccountBalances: currentAllAccountBalances,
      lowestAccountId: currentLowestAccount.id,
      lowestAccountName: currentLowestAccount.name,
      lowestAccountBalance: currentLowestAccount.balance,
    });
    cursor = addDays(cursor, 1);
  }

  const monthlyMap = new Map();
  forEachMonth(start, end, (year, monthIndex) => {
    const date = new Date(year, monthIndex, 1);
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    monthlyMap.set(key, {
      key,
      monthLabel: formatMonth(date),
      discretionaryBudget: getResolvedMonthPlanValues(normalized, key).discretionaryBudget,
      income: 0,
      bankExpenses: 0,
      cardPayments: 0,
      currentCardPayments: 0,
      accruedCardPayments: 0,
      estimatedCardPayments: 0,
      investments: 0,
      retirementContributions: 0,
      totalOutflows: 0,
      net: 0,
    });
  });

  for (const event of eventRows) {
    const key = `${event.date.getFullYear()}-${String(event.date.getMonth() + 1).padStart(2, '0')}`;
    const month = monthlyMap.get(key);
    if (!month) continue;
    if (event.type === 'income') month.income += event.amount;
    if (event.type === 'expense') month.bankExpenses += Math.abs(event.amount);
    if (event.type === 'investment') month.investments += Math.abs(event.amount);
    if (event.type === 'card-payment') {
      month.cardPayments += Math.abs(event.amount);
      if (event.cardPhase === 'current') month.currentCardPayments += Math.abs(event.amount);
      if (event.cardPhase === 'accrued') month.accruedCardPayments += Math.abs(event.amount);
      if (event.cardPhase === 'estimated') month.estimatedCardPayments += Math.abs(event.amount);
    }
    if (event.amount < 0) month.totalOutflows += Math.abs(event.amount);
    month.net += event.amount;
  }

  for (const contribution of investmentEvents) {
    if (!Number(contribution.amount)) continue;
    const key = `${contribution.date.getFullYear()}-${String(contribution.date.getMonth() + 1).padStart(2, '0')}`;
    const month = monthlyMap.get(key);
    if (month) {
      month.retirementContributions += Math.abs(contribution.amount);
    }
  }

  const monthlySummaries = Array.from(monthlyMap.values()).map((month) => ({
    ...month,
    availableForBudget: month.income - month.totalOutflows,
    afterBudget: month.income - month.totalOutflows - Math.abs(month.discretionaryBudget || 0),
  }));

  const tightestMonth = monthlySummaries.reduce(
    (min, month) => (month.availableForBudget < min.availableForBudget ? month : min),
    monthlySummaries[0] ?? { availableForBudget: 0, monthLabel: '—', afterBudget: 0 }
  );

  const safeMonthlyInvestAmount = monthlySummaries.reduce(
    (lowest, month) => Math.min(lowest, month.availableForBudget - Math.abs(month.discretionaryBudget || 0)),
    Number.POSITIVE_INFINITY
  );
  const resolvedSafeMonthlyInvestAmount = Number.isFinite(safeMonthlyInvestAmount) ? safeMonthlyInvestAmount : 0;
  const cardPaymentBreakdown = eventRows.reduce(
    (totals, event) => {
      if (event.type !== 'card-payment') return totals;
      const amount = Math.abs(event.amount);
      totals.total += amount;
      if (event.cardPhase === 'current') totals.current += amount;
      if (event.cardPhase === 'accrued') totals.accrued += amount;
      if (event.cardPhase === 'estimated') totals.estimated += amount;
      return totals;
    },
    { total: 0, current: 0, accrued: 0, estimated: 0 }
  );
  const accountTimelines = cashAccounts.map((account) => {
    const points = timeline.map((point) => ({
      date: point.date,
      balance: point.accountBalances?.[account.id] ?? 0,
    }));
    const minimumPoint = points.reduce(
      (lowest, point) => (point.balance < lowest.balance ? point : lowest),
      points[0] ?? { date: start, balance: Number(account.balance) || 0 }
    );
    const nextNegativePoint = points.find((point) => point.balance < 0);

    return {
      id: account.id,
      name: account.name,
      points,
      minimumBalance: minimumPoint.balance,
      minimumDate: minimumPoint.date,
      nextNegativeDate: nextNegativePoint?.date ?? null,
      nextNegativeBalance: nextNegativePoint?.balance ?? null,
    };
  });
  const cashTimeline = timeline.map((point) => ({
    date: point.date,
    balance: point.balance,
    accountBalances: point.accountBalances,
    lowestAccountId: point.lowestAccountId,
    lowestAccountName: point.lowestAccountName,
    lowestAccountBalance: point.lowestAccountBalance,
  }));
  const netWorthTimeline = timeline.map((point) => ({
    date: point.date,
    balance: point.netWorth,
    accountBalances: point.allAccountBalances,
    lowestAccountId: point.lowestAccountId,
    lowestAccountName: point.lowestAccountName,
    lowestAccountBalance: point.lowestAccountBalance,
  }));
  const netWorthOverlayTimelines = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    points: timeline.map((point) => ({ date: point.date, balance: point.allAccountBalances?.[account.id] ?? 0 })),
    minimumBalance: Math.min(...timeline.map((point) => point.allAccountBalances?.[account.id] ?? 0)),
  }));
  const nextAccountRiskPoint = timeline.find((point) => point.lowestAccountBalance < 0) ?? null;
  const lowestAccount = accountTimelines.reduce(
    (lowest, account) => (account.minimumBalance < lowest.minimumBalance ? account : lowest),
    accountTimelines[0] ?? { id: '', name: '—', minimumBalance: 0, minimumDate: start }
  );

  return {
    events: eventRows,
    timeline: cashTimeline,
    cashTimeline,
    netWorthTimeline,
    accountTimelines,
    netWorthOverlayTimelines,
    nextAccountRiskPoint,
    lowestAccount,
    monthlySummaries,
    tightestMonth,
    safeMonthlyInvestAmount: resolvedSafeMonthlyInvestAmount,
    budgetCompatible: monthlySummaries.every((month) => month.afterBudget >= 0),
    totalCardPayments: cardPaymentBreakdown.total,
    cardPaymentBreakdown,
    monthlyIncomeEstimate: monthlySummaries.length
      ? monthlySummaries.reduce((sum, month) => sum + month.income, 0) / monthlySummaries.length
      : 0,
    monthlyExpenseEstimate: normalized.recurringExpenses.reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0),
    monthlyInvestmentEstimate: monthlySummaries.length
      ? monthlySummaries.reduce((sum, month) => sum + month.investments, 0) / monthlySummaries.length
      : 0,
    endingNetWorth: netWorthTimeline.at(-1)?.balance ?? 0,
  };
}

function validateOnboardingStep(stepIndex, draft) {
  if (stepIndex === 0) return true;
  if (stepIndex === 1) return draft.accounts.length > 0 && draft.accounts.every((item) => item.name.trim());
  if (stepIndex === 2) {
    const currentYear = parseLocalDate(draft.startDate).getFullYear();
    const incomeSettings = getResolvedIncomeYearSettings(draft.incomeModel, currentYear);
    return incomeSettings.baseSalary >= 0 && incomeSettings.bonusAmount >= 0;
  }
  if (stepIndex === 3) return draft.recurringExpenses.every((item) => item.name.trim() && Number(item.amount) >= 0);
  if (stepIndex === 4) {
    return draft.creditCards.every(
      (card) =>
        card.name.trim() &&
        isIsoDate(card.nextDueDate) &&
        Number(card.currentBalance) >= 0 &&
        Number(card.accruedBalance) >= 0 &&
        Number(card.monthlySpend) >= 0
    );
  }
  if (stepIndex === 5) return draft.cashReserveTarget >= 0 && draft.monthlyDiscretionaryBudget >= 0;
  if (stepIndex === 6) return true; // Investing step — all fields are optional
  return true;
}

function normalizePlan(raw = {}) {
  const accounts = ensureRequiredAccounts(migrateLegacyInvestmentAccounts(normalizeAccounts(raw.accounts), raw.investmentModel));
  const projectionYears = clampProjectionYears(raw.projectionYears ?? Math.max(1, Math.ceil((Number(raw.months) || 12) / 12)));

  return {
    startDate: isIsoDate(raw.startDate) ? raw.startDate : todayISO(),
    months: clampMonths(raw.months),
    projectionYears,
    cashReserveTarget: Number(raw.cashReserveTarget) || 0,
    monthlyDiscretionaryBudget: Number(raw.monthlyDiscretionaryBudget) || 0,
    monthlyInvestment: Math.max(0, Number(raw.monthlyInvestment) || 0),
    monthlyInvestmentDay: clampDay(raw.monthlyInvestmentDay ?? parseInvestmentFallbackDay(raw.startDate)),
    paycheckKeepSchedule: normalizePaycheckKeepSchedule(raw.paycheckKeepSchedule),
    incomeModel: normalizeIncomeModel(raw.incomeModel, accounts, raw.paychecks, raw.startDate),
    investmentModel: normalizeInvestmentModel(raw.investmentModel, accounts, raw),
    monthlyOverrides: normalizeMonthlyOverrides(raw.monthlyOverrides),
    accounts,
    paychecks: normalizeRecurringList(raw.paychecks, 'Paycheck', createPaycheck, accounts),
    recurringExpenses: normalizeRecurringList(raw.recurringExpenses, 'Expense', createExpense, accounts),
    creditCards: normalizeCards(raw.creditCards, accounts),
  };
}

function getOnboardingProgress(raw = {}) {
  const meta = raw?.[ONBOARDING_META_KEY];
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;

  return {
    complete: meta.complete === true,
    stepIndex: clampOnboardingStepIndex(meta.stepIndex),
  };
}

function withOnboardingProgress(plan, stepIndex) {
  return {
    ...withoutOnboardingProgress(plan),
    [ONBOARDING_META_KEY]: {
      complete: false,
      stepIndex: clampOnboardingStepIndex(stepIndex),
      savedAt: new Date().toISOString(),
    },
  };
}

function withoutOnboardingProgress(raw = {}) {
  const { [ONBOARDING_META_KEY]: _onboardingProgress, ...plan } = raw && typeof raw === 'object' ? raw : {};
  return plan;
}

function clampOnboardingStepIndex(value) {
  return Math.min(ONBOARDING_STEP_COUNT - 1, Math.max(0, Math.trunc(Number(value) || 0)));
}

function createEmptyPlan() {
  const accounts = [createAccount()];
  return {
    startDate: todayISO(),
    months: 6,
    projectionYears: 1,
    cashReserveTarget: 0,
    monthlyDiscretionaryBudget: 0,
    monthlyInvestment: 0,
    monthlyInvestmentDay: parseInvestmentFallbackDay(todayISO()),
    paycheckKeepSchedule: {},
    incomeModel: createIncomeModel(accounts, new Date().getFullYear()),
    investmentModel: createInvestmentModel(accounts, todayISO()),
    monthlyOverrides: {},
    accounts,
    paychecks: [],
    recurringExpenses: [],
    creditCards: [],
  };
}

function normalizeAccounts(list) {
  if (!Array.isArray(list) || !list.length) return [createAccount()];
  return list.map((item, index) => {
    const accountType = normalizeAccountType(item.accountType);
    const investmentSubtype = accountType === 'investment' ? normalizeInvestmentSubtype(item.investmentSubtype) : '';
    return {
      id: item.id || makeId(),
      name: item.name || defaultAccountName(accountType, investmentSubtype, index),
      balance: Number(item.balance) || 0,
      accountType,
      investmentSubtype,
    };
  });
}

function normalizeRecurringList(list, fallbackName, fallbackFactory, accounts = []) {
  if (!Array.isArray(list)) return [];
  return list.map((item, index) => ({
    id: item.id || makeId(),
    name: item.name || `${fallbackName} ${index + 1}`,
    amount: Number(item.amount) || 0,
    dayOfMonth: clampDay(item.dayOfMonth),
    accountId: resolveCashAccountId(item.accountId, accounts),
  }));
}

function normalizeCards(list, accounts = []) {
  if (!Array.isArray(list)) return [];
  return list.map((card, index) => ({
    id: card.id || makeId(),
    name: card.name || `Card ${index + 1}`,
    currentBalance: Number(card.currentBalance) || 0,
    accruedBalance: Number(card.accruedBalance) || 0,
    paymentAccountId: resolveCashAccountId(card.paymentAccountId, accounts),
    nextDueDate: isIsoDate(card.nextDueDate) ? card.nextDueDate : todayISO(),
    monthlySpend: Number(card.monthlySpend) || 0,
    statementDay: clampDay(card.statementDay),
    dueDay: clampDay(card.dueDay),
  }));
}

function createAccount(name = 'Checking', accountType = 'cash', investmentSubtype = '') {
  const normalizedType = normalizeAccountType(accountType);
  const normalizedSubtype = normalizedType === 'investment' ? normalizeInvestmentSubtype(investmentSubtype) : '';
  return { id: makeId(), name, balance: 0, accountType: normalizedType, investmentSubtype: normalizedSubtype };
}

function createPaycheck(accountId = '') {
  return { id: makeId(), name: 'Paycheck', amount: 0, dayOfMonth: 1, accountId };
}

function createExpense(accountId = '') {
  return { id: makeId(), name: 'Rent', amount: 0, dayOfMonth: 1, accountId };
}

function createCard(index = 1, paymentAccountId = '') {
  return {
    id: makeId(),
    name: `Card ${index}`,
    currentBalance: 0,
    accruedBalance: 0,
    paymentAccountId,
    nextDueDate: isoFromToday(14),
    monthlySpend: 0,
    statementDay: 20,
    dueDay: 17,
  };
}

function totalCash(accounts) {
  return getCashAccounts(accounts).reduce((sum, account) => sum + Number(account.balance || 0), 0);
}

function totalInvestments(accounts) {
  return getInvestmentAccounts(accounts).reduce((sum, account) => sum + Number(account.balance || 0), 0);
}

function snapshotAccountBalances(accounts, balancesById = {}) {
  return Object.fromEntries(
    accounts.map((account) => [account.id, Number(balancesById[account.id]) || 0])
  );
}

function sumAccountBalances(accountBalances, accounts = []) {
  const allowedIds = Array.isArray(accounts) && accounts.length ? new Set(accounts.map((account) => account.id)) : null;
  return Object.entries(accountBalances || {}).reduce((sum, [accountId, balance]) => {
    if (allowedIds && !allowedIds.has(accountId)) return sum;
    return sum + (Number(balance) || 0);
  }, 0);
}

function getLowestAccountEntry(accounts, accountBalances) {
  const cashAccounts = getCashAccounts(accounts);
  const fallback = cashAccounts[0] ? { id: cashAccounts[0].id, name: cashAccounts[0].name, balance: Number(accountBalances?.[cashAccounts[0].id]) || 0 } : { id: '', name: '—', balance: 0 };
  return cashAccounts.reduce((lowest, account) => {
    const balance = Number(accountBalances?.[account.id]) || 0;
    return balance < lowest.balance ? { id: account.id, name: account.name, balance } : lowest;
  }, fallback);
}

function clampMonths(value) {
  return Math.max(1, Math.min(18, Number(value) || 6));
}

function clampProjectionYears(value) {
  return Math.max(1, Math.min(30, Number(value) || 1));
}

function clampPercentage(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function resolveAccountId(accountId, accounts) {
  if (!Array.isArray(accounts) || !accounts.length) return '';
  const normalizedId = String(accountId || '');
  const matched = accounts.find((account) => account.id === normalizedId);
  return matched?.id || accounts[0].id;
}

function getPrimaryAccountId(accounts) {
  return resolveCashAccountId(accounts[0]?.id, accounts);
}

function getAccountNameById(accounts, accountId) {
  const resolvedId = resolveAccountId(accountId, accounts);
  return accounts.find((account) => account.id === resolvedId)?.name || 'Primary account';
}

function normalizeAccountType(value) {
  return value === 'investment' ? 'investment' : 'cash';
}

function normalizeInvestmentSubtype(value) {
  const normalized = String(value || '');
  return INVESTMENT_SUBTYPE_OPTIONS.some((option) => option.value === normalized) ? normalized : 'brokerage';
}

function getInvestmentSubtypeLabel(value) {
  return INVESTMENT_SUBTYPE_OPTIONS.find((option) => option.value === value)?.label || 'Investment';
}

function defaultAccountName(accountType, investmentSubtype, index = 0) {
  if (accountType === 'investment') {
    return getInvestmentSubtypeLabel(investmentSubtype);
  }
  return index === 0 ? 'Checking' : `Cash account ${index + 1}`;
}

function getCashAccounts(accounts) {
  return normalizeAccounts(accounts).filter((account) => account.accountType === 'cash');
}

function getInvestmentAccounts(accounts) {
  return normalizeAccounts(accounts).filter((account) => account.accountType === 'investment');
}

function resolveAccountIdByType(accountId, accounts, accountType) {
  const filtered = normalizeAccounts(accounts).filter((account) => account.accountType === accountType);
  if (!filtered.length) return '';
  return resolveAccountId(accountId, filtered);
}

function resolveCashAccountId(accountId, accounts) {
  return resolveAccountIdByType(accountId, accounts, 'cash');
}

function resolveInvestmentAccountId(accountId, accounts) {
  return resolveAccountIdByType(accountId, accounts, 'investment');
}

function getDefaultRetirementAccountId(accounts) {
  const investmentAccounts = getInvestmentAccounts(accounts);
  const preferred = investmentAccounts.find((account) => ['roth_401k', 'traditional_401k'].includes(account.investmentSubtype));
  return preferred?.id || resolveInvestmentAccountId(investmentAccounts[0]?.id, investmentAccounts);
}

function migrateLegacyInvestmentAccounts(accounts, investmentModel) {
  const normalizedAccounts = normalizeAccounts(accounts);
  const normalizedInvestmentModel = investmentModel && typeof investmentModel === 'object' ? investmentModel : {};
  const nextAccounts = [...normalizedAccounts];
  const hasBrokerage = nextAccounts.some((account) => account.accountType === 'investment' && account.investmentSubtype === 'brokerage');
  const has401k = nextAccounts.some((account) => account.accountType === 'investment' && ['roth_401k', 'traditional_401k'].includes(account.investmentSubtype));

  if (!hasBrokerage && Math.max(0, Number(normalizedInvestmentModel.startingBrokerageBalance) || 0) > 0) {
    nextAccounts.push({
      ...createAccount('Brokerage', 'investment', 'brokerage'),
      balance: Math.max(0, Number(normalizedInvestmentModel.startingBrokerageBalance) || 0),
    });
  }

  if (!has401k && Math.max(0, Number(normalizedInvestmentModel.startingRetirementBalance) || 0) > 0) {
    nextAccounts.push({
      ...createAccount('Roth 401(k)', 'investment', 'roth_401k'),
      balance: Math.max(0, Number(normalizedInvestmentModel.startingRetirementBalance) || 0),
    });
  }

  return nextAccounts;
}

function ensureRequiredAccounts(accounts) {
  const normalized = normalizeAccounts(accounts);
  if (!normalized.length) return [createAccount()];
  if (getCashAccounts(normalized).length) return normalized;
  return [createAccount(), ...normalized];
}

function removeAccountFromPlan(plan, accountId) {
  const nextAccounts = ensureRequiredAccounts((Array.isArray(plan.accounts) ? plan.accounts : []).filter((account) => account.id !== accountId));
  return {
    ...plan,
    accounts: nextAccounts,
    incomeModel: {
      ...normalizeIncomeModel(plan.incomeModel, nextAccounts, plan.paychecks, plan.startDate),
      depositAccountId: resolveCashAccountId(plan.incomeModel?.depositAccountId, nextAccounts),
    },
    investmentModel: {
      ...normalizeInvestmentModel(plan.investmentModel, nextAccounts, plan),
      sourceAccountId: resolveCashAccountId(plan.investmentModel?.sourceAccountId, nextAccounts),
      destinationAccountId: resolveInvestmentAccountId(plan.investmentModel?.destinationAccountId, nextAccounts),
      retirementAccountId: resolveInvestmentAccountId(plan.investmentModel?.retirementAccountId, nextAccounts),
    },
    paychecks: normalizeRecurringList(plan.paychecks, 'Paycheck', createPaycheck, nextAccounts),
    recurringExpenses: normalizeRecurringList(plan.recurringExpenses, 'Expense', createExpense, nextAccounts),
    creditCards: normalizeCards(plan.creditCards, nextAccounts),
  };
}

function clampDay(value) {
  return Math.min(31, Math.max(1, Number(value) || 1));
}

function normalizePaycheckKeepSchedule(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .map(([key, value]) => [normalizeMonthPatternKey(key), value])
      .filter(([key]) => key)
      .map(([key, value]) => {
        const numeric = Number(value);
        return [key, Number.isFinite(numeric) ? clampPercentage(numeric) : 100];
      })
  );
}

function getPaycheckKeepRate(schedule, monthKey) {
  const normalized = normalizePaycheckKeepSchedule(schedule);
  return normalized[normalizeMonthPatternKey(monthKey)] ?? 100;
}

function updatePaycheckKeepSchedule(schedule, monthKey, value) {
  const normalized = { ...normalizePaycheckKeepSchedule(schedule) };
  const patternKey = normalizeMonthPatternKey(monthKey);
  const next = clampPercentage(value);
  if (next === 100) {
    delete normalized[patternKey];
  } else {
    normalized[patternKey] = next;
  }
  return normalized;
}

function buildProjectedMonthConfigs(startDate, months) {
  const start = parseLocalDate(startDate);
  const end = addMonths(start, months);
  const configs = [];

  forEachMonth(start, end, (year, monthIndex) => {
    const date = new Date(year, monthIndex, 1);
    configs.push({
      key: monthKeyFromDate(date),
      label: formatMonth(date),
      date,
    });
  });

  return configs;
}

function buildMonthOfYearConfigs() {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const date = new Date(2026, monthIndex, 1);
    return {
      key: String(monthIndex + 1).padStart(2, '0'),
      label: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date),
      date,
    };
  });
}

function buildProjectedYearConfigs(startDate, projectionYears) {
  const startYear = parseLocalDate(startDate).getFullYear();
  return Array.from({ length: clampProjectionYears(projectionYears) }, (_, index) => {
    const year = startYear + index;
    return { key: String(year), year };
  });
}

function buildProjectedTimelineMonths(startDate, projectionYears) {
  const start = parseLocalDate(startDate);
  const end = addDays(addMonths(start, clampProjectionYears(projectionYears) * 12), -1);
  const configs = [];

  forEachMonth(start, end, (year, monthIndex) => {
    const date = new Date(year, monthIndex, 1);
    configs.push({
      key: monthKeyFromDate(date),
      label: formatMonth(date),
      date,
      year,
    });
  });

  return configs;
}

async function loadStoredPlan() {
  const response = await fetch('/api/plan', { cache: 'no-store' }).catch(() => null);
  if (!response) return { ok: false, message: 'Could not reach cloud storage.' };
  if (response.status === 401) return { ok: false, unauthorized: true };

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, message: result.error || 'Cloud storage is not available.' };
  }

  return {
    ok: true,
    data: result.data,
    storageLabel: result.storageLabel || 'Cloud database',
  };
}

async function saveStoredPlan(plan) {
  const response = await fetch('/api/plan', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  }).catch(() => null);
  if (!response) return { ok: false, message: 'Could not reach cloud storage.' };
  if (response.status === 401) return { ok: false, unauthorized: true };

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, message: result.error || 'Could not save to cloud storage.' };
  }

  return {
    ok: true,
    savedAt: result.savedAt,
    storageLabel: result.storageLabel || 'Cloud database',
  };
}

async function resetStoredPlan() {
  await fetch('/api/plan', { method: 'DELETE' }).catch(() => null);
  return { ok: true };
}

async function fetchSession() {
  const response = await fetch('/api/auth/session', { cache: 'no-store' }).catch(() => null);
  if (!response) return { ok: false, message: 'Could not reach account service.' };

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, message: result.error || 'Account service is not available.' };
  }

  return {
    ok: true,
    user: result.user || null,
  };
}

function loadLegacyBrowserPlan() {
  if (typeof window === 'undefined') {
    return { ok: true, data: null, storageLabel: 'This browser' };
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_LOCAL_PLAN_KEY);
    return {
      ok: true,
      data: raw ? JSON.parse(raw) : null,
      storageLabel: 'This browser',
    };
  } catch {
    return { ok: true, data: null, storageLabel: 'This browser' };
  }
}

function removeLegacyBrowserPlan() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LEGACY_LOCAL_PLAN_KEY);
  }
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2, 11)}`;
}

function todayISO() {
  return toISODate(new Date());
}

function parseInvestmentFallbackDay(startDate) {
  if (!isIsoDate(startDate)) return 1;
  return clampDay(Number(String(startDate).slice(8, 10)) || 1);
}

function createTaxBracket(upTo = 0, rate = 0) {
  return { id: makeId(), upTo, rate };
}

function createDeduction(label = 'Deduction', amount = 0) {
  return { id: makeId(), label, amount };
}

function createIncomeYearSettings(seed = {}) {
  const validStatuses = ['single', 'married_jointly', 'married_separately', 'head_of_household'];
  const filingStatus = validStatuses.includes(seed.filingStatus) ? seed.filingStatus : 'single';
  const defaultDeduction = FEDERAL_STANDARD_DEDUCTION_2026[filingStatus];
  return {
    filingStatus,
    baseSalary: Math.max(0, Number(seed.baseSalary) || 0),
    bonusAmount: Math.max(0, Number(seed.bonusAmount) || 0),
    federalStandardDeduction: seed.federalStandardDeduction != null
      ? Math.max(0, Number(seed.federalStandardDeduction) || 0)
      : defaultDeduction,
    stateTaxRate: Math.max(0, Number(seed.stateTaxRate) || 0),
    socialSecurityRate: Math.max(0, Number(seed.socialSecurityRate) || 6.2),
    socialSecurityWageBase: Math.max(0, Number(seed.socialSecurityWageBase) || 176100),
    medicareRate: Math.max(0, Number(seed.medicareRate) || 1.45),
    additionalMedicareRate: Math.max(0, Number(seed.additionalMedicareRate) || 0.9),
    additionalMedicareThreshold: Math.max(0, Number(seed.additionalMedicareThreshold) || 200000),
    roth401kPercent: clampPercentage(seed.roth401kPercent ?? 0),
    afterTax401kPercent: clampPercentage(seed.afterTax401kPercent ?? 0),
    employerMatchPercent: clampPercentage(seed.employerMatchPercent ?? 4),
    roth401kLimit: Math.max(0, Number(seed.roth401kLimit) || 24500),
    total401kLimit: Math.max(0, Number(seed.total401kLimit) || 69000),
    federalBrackets: normalizeTaxBrackets(seed.federalBrackets, filingStatus),
    pretaxDeductions: normalizeDeductionList(seed.pretaxDeductions, 'Healthcare FSA'),
    postTaxDeductions: normalizeDeductionList(seed.postTaxDeductions, 'Post-tax deduction'),
  };
}

function createIncomeModel(accounts = [], seedYear = new Date().getFullYear()) {
  return {
    payDayOfMonth: 6,
    depositAccountId: resolveCashAccountId(getPrimaryAccountId(accounts), accounts),
    bonusMonth: 3,
    bonusDay: 6,
    yearlySettings: {
      [seedYear]: createIncomeYearSettings(),
    },
  };
}

function createInvestmentModel(accounts = [], startDate = todayISO(), raw = {}) {
  return {
    sourceAccountId: resolveCashAccountId(raw.sourceAccountId ?? raw.investmentSourceAccountId, accounts),
    destinationAccountId: resolveInvestmentAccountId(raw.destinationAccountId ?? raw.brokerageAccountId, accounts),
    retirementAccountId: resolveInvestmentAccountId(raw.retirementAccountId, accounts) || getDefaultRetirementAccountId(accounts),
    recurringDayOfMonth: clampDay(raw.recurringDayOfMonth ?? raw.monthlyInvestmentDay ?? parseInvestmentFallbackDay(startDate)),
    recurringAmount: Math.max(0, Number(raw.recurringAmount ?? raw.monthlyInvestment) || 0),
    startingBrokerageBalance: Math.max(0, Number(raw.startingBrokerageBalance) || 0),
    startingRetirementBalance: Math.max(0, Number(raw.startingRetirementBalance) || 0),
    annualReturnRate: Number.isFinite(Number(raw.annualReturnRate)) ? Number(raw.annualReturnRate) : 7,
  };
}

function createIncomeYearTracker(seed = {}) {
  return {
    rothEmployee: Math.max(0, Number(seed.rothEmployee) || 0),
    afterTax: Math.max(0, Number(seed.afterTax) || 0),
    employerMatch: Math.max(0, Number(seed.employerMatch) || 0),
    socialSecurityTaxable: Math.max(0, Number(seed.socialSecurityTaxable) || 0),
    medicareTaxable: Math.max(0, Number(seed.medicareTaxable) || 0),
  };
}

function buildPayrollOccurrencesForYear(year, incomeModel) {
  const model = normalizeIncomeModel(incomeModel);
  const occurrences = [];

  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    occurrences.push({
      date: makeClampedDate(year, monthIndex, model.payDayOfMonth),
      kind: 'salary',
    });
  }

  occurrences.push({
    date: makeClampedDate(year, model.bonusMonth - 1, model.bonusDay),
    kind: 'bonus',
  });

  return occurrences.sort((left, right) => left.date - right.date || left.kind.localeCompare(right.kind));
}

function buildPayrollOccurrencesForRange(start, end, incomeModel) {
  const model = normalizeIncomeModel(incomeModel);
  const occurrences = [];

  forEachMonth(start, end, (year, monthIndex) => {
    const salaryDate = makeClampedDate(year, monthIndex, model.payDayOfMonth);
    if (salaryDate >= start && salaryDate <= end) {
      occurrences.push({ date: salaryDate, kind: 'salary' });
    }
  });

  for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
    const bonusDate = makeClampedDate(year, model.bonusMonth - 1, model.bonusDay);
    if (bonusDate >= start && bonusDate <= end) {
      occurrences.push({ date: bonusDate, kind: 'bonus' });
    }
  }

  return occurrences.sort((left, right) => left.date - right.date || left.kind.localeCompare(right.kind));
}

function calculatePayrollOccurrence(settings, tracker, kind) {
  const currentTracker = createIncomeYearTracker(tracker);
  const gross = kind === 'bonus'
    ? Math.max(0, settings.bonusAmount)
    : Math.max(0, settings.baseSalary) / 12;

  if (gross <= 0) {
    return {
      kind,
      gross: 0,
      pretaxDeductions: 0,
      postTaxDeductions: 0,
      taxableWages: 0,
      federalTax: 0,
      stateTax: 0,
      socialSecurityTax: 0,
      medicareTax: 0,
      additionalMedicareTax: 0,
      taxTotal: 0,
      rothContribution: 0,
      afterTaxContribution: 0,
      employeeRetirementContribution: 0,
      employerMatch: 0,
      totalRetirementContribution: 0,
      netCash: 0,
      nextTracker: currentTracker,
    };
  }

  const pretaxDeductions = kind === 'salary' ? sumDeductionAmounts(settings.pretaxDeductions) : 0;
  const postTaxDeductions = kind === 'salary' ? sumDeductionAmounts(settings.postTaxDeductions) : 0;
  const taxableWages = Math.max(0, gross - pretaxDeductions);
  const annualPretaxDeductions = sumDeductionAmounts(settings.pretaxDeductions) * 12;
  const annualSalaryTaxable = Math.max(0, settings.baseSalary - annualPretaxDeductions - settings.federalStandardDeduction);
  const annualWithBonusTaxable = Math.max(0, settings.baseSalary + settings.bonusAmount - annualPretaxDeductions - settings.federalStandardDeduction);
  const federalTax = kind === 'bonus'
    ? Math.max(0, calculateProgressiveTax(annualWithBonusTaxable, settings.federalBrackets) - calculateProgressiveTax(annualSalaryTaxable, settings.federalBrackets))
    : calculateProgressiveTax(annualSalaryTaxable, settings.federalBrackets) / 12;
  const stateTax = kind === 'bonus'
    ? taxableWages * (settings.stateTaxRate / 100)
    : Math.max(0, (settings.baseSalary - annualPretaxDeductions) * (settings.stateTaxRate / 100)) / 12;

  const socialSecurityTaxable = Math.max(0, Math.min(taxableWages, settings.socialSecurityWageBase - currentTracker.socialSecurityTaxable));
  const socialSecurityTax = socialSecurityTaxable * (settings.socialSecurityRate / 100);

  const medicareTax = taxableWages * (settings.medicareRate / 100);
  const additionalMedicareTaxable = Math.max(0, currentTracker.medicareTaxable + taxableWages - settings.additionalMedicareThreshold)
    - Math.max(0, currentTracker.medicareTaxable - settings.additionalMedicareThreshold);
  const additionalMedicareTax = Math.max(0, additionalMedicareTaxable) * (settings.additionalMedicareRate / 100);

  const rothDesired = gross * (settings.roth401kPercent / 100);
  const rothContribution = Math.max(0, Math.min(rothDesired, settings.roth401kLimit - currentTracker.rothEmployee));

  const afterTaxDesired = gross * (settings.afterTax401kPercent / 100);
  const afterTaxRoom = Math.max(0, settings.total401kLimit - (currentTracker.rothEmployee + rothContribution) - currentTracker.afterTax - currentTracker.employerMatch);
  const afterTaxContribution = Math.max(0, Math.min(afterTaxDesired, afterTaxRoom));

  const employerMatchDesired = kind === 'salary' ? gross * (settings.employerMatchPercent / 100) : 0;
  const employerMatchRoom = Math.max(0, settings.total401kLimit - (currentTracker.rothEmployee + rothContribution) - (currentTracker.afterTax + afterTaxContribution) - currentTracker.employerMatch);
  const employerMatch = Math.max(0, Math.min(employerMatchDesired, employerMatchRoom));

  const taxTotal = federalTax + stateTax + socialSecurityTax + medicareTax + additionalMedicareTax;
  const employeeRetirementContribution = rothContribution + afterTaxContribution;
  const totalRetirementContribution = employeeRetirementContribution + employerMatch;
  const netCash = Math.max(0, gross - pretaxDeductions - taxTotal - employeeRetirementContribution - postTaxDeductions);

  return {
    kind,
    gross,
    pretaxDeductions,
    postTaxDeductions,
    taxableWages,
    federalTax,
    stateTax,
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    taxTotal,
    rothContribution,
    afterTaxContribution,
    employeeRetirementContribution,
    employerMatch,
    totalRetirementContribution,
    netCash,
    nextTracker: createIncomeYearTracker({
      rothEmployee: currentTracker.rothEmployee + rothContribution,
      afterTax: currentTracker.afterTax + afterTaxContribution,
      employerMatch: currentTracker.employerMatch + employerMatch,
      socialSecurityTaxable: currentTracker.socialSecurityTaxable + socialSecurityTaxable,
      medicareTaxable: currentTracker.medicareTaxable + taxableWages,
    }),
  };
}

function simulateIncomeYearPreview(incomeModel, year) {
  const model = normalizeIncomeModel(incomeModel);
  const settings = createIncomeYearSettings(getResolvedIncomeYearSettings(model, year));
  let tracker = createIncomeYearTracker();

  const occurrences = buildPayrollOccurrencesForYear(year, model);
  const events = occurrences.map((occurrence) => {
    const result = calculatePayrollOccurrence(settings, tracker, occurrence.kind);
    tracker = result.nextTracker;
    return {
      ...result,
      date: occurrence.date,
    };
  });

  const totals = events.reduce(
    (sum, event) => ({
      gross: sum.gross + event.gross,
      pretaxDeductions: sum.pretaxDeductions + event.pretaxDeductions,
      taxes: sum.taxes + event.taxTotal,
      employeeRetirement: sum.employeeRetirement + event.employeeRetirementContribution,
      employerMatch: sum.employerMatch + event.employerMatch,
      postTaxDeductions: sum.postTaxDeductions + event.postTaxDeductions,
      takeHome: sum.takeHome + event.netCash,
    }),
    {
      gross: 0,
      pretaxDeductions: 0,
      taxes: 0,
      employeeRetirement: 0,
      employerMatch: 0,
      postTaxDeductions: 0,
      takeHome: 0,
    }
  );

  return {
    settings,
    salaryPreview: events.find((event) => event.kind === 'salary') || null,
    bonusPreview: events.find((event) => event.kind === 'bonus' && event.gross > 0) || null,
    totals: {
      ...totals,
      totalRetirement: totals.employeeRetirement + totals.employerMatch,
      effectiveTaxRate: totals.gross > 0 ? (totals.taxes / totals.gross) * 100 : 0,
    },
  };
}

function normalizeTaxBrackets(list, filingStatus = 'single') {
  const defaultBrackets = (FEDERAL_BRACKETS_2026[filingStatus] || FEDERAL_BRACKETS_2026.single)
    .map((b) => createTaxBracket(b.upTo, b.rate));
  const raw = Array.isArray(list) && list.length ? list : defaultBrackets;

  return raw
    .map((item) => ({
      id: item.id || makeId(),
      upTo: Math.max(0, Number(item.upTo) || 0),
      rate: Math.max(0, Number(item.rate) || 0),
    }))
    .sort((left, right) => {
      const leftLimit = left.upTo === 0 ? Number.POSITIVE_INFINITY : left.upTo;
      const rightLimit = right.upTo === 0 ? Number.POSITIVE_INFINITY : right.upTo;
      return leftLimit - rightLimit;
    });
}

function normalizeDeductionList(list, fallbackLabel) {
  if (!Array.isArray(list)) return [];
  return list.map((item, index) => ({
    id: item.id || makeId(),
    label: String(item.label || `${fallbackLabel} ${index + 1}`).trim() || `${fallbackLabel} ${index + 1}`,
    amount: Math.max(0, Number(item.amount) || 0),
  }));
}

function normalizeIncomeModel(raw, accounts = [], legacyPaychecks = [], startDate = todayISO()) {
  const fallbackYear = parseLocalDate(startDate).getFullYear();
  const base = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw
    : createLegacyIncomeModel(accounts, legacyPaychecks, fallbackYear);

  const yearlySettings = normalizeYearlySettings(base.yearlySettings, fallbackYear);

  return {
    payDayOfMonth: clampDay(base.payDayOfMonth ?? legacyPaychecks?.[0]?.dayOfMonth ?? parseInvestmentFallbackDay(startDate)),
    depositAccountId: resolveCashAccountId(base.depositAccountId ?? legacyPaychecks?.[0]?.accountId, accounts),
    bonusMonth: clampMonth(base.bonusMonth ?? 3),
    bonusDay: clampDay(base.bonusDay ?? 6),
    yearlySettings,
  };
}

function createLegacyIncomeModel(accounts = [], legacyPaychecks = [], fallbackYear = new Date().getFullYear()) {
  const totalMonthlyPay = Array.isArray(legacyPaychecks)
    ? legacyPaychecks.reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0)
    : 0;

  return {
    payDayOfMonth: clampDay(legacyPaychecks?.[0]?.dayOfMonth ?? 6),
    depositAccountId: resolveCashAccountId(legacyPaychecks?.[0]?.accountId, accounts),
    bonusMonth: 3,
    bonusDay: 6,
    yearlySettings: {
      [fallbackYear]: createIncomeYearSettings({
        baseSalary: totalMonthlyPay * 12,
        bonusAmount: 0,
        federalStandardDeduction: 0,
        stateTaxRate: 0,
        socialSecurityRate: 0,
        medicareRate: 0,
        additionalMedicareRate: 0,
        roth401kPercent: 0,
        afterTax401kPercent: 0,
        employerMatchPercent: 0,
        roth401kLimit: 24500,
        total401kLimit: 69000,
        federalBrackets: [createTaxBracket(0, 0)],
      }),
    },
  };
}

function normalizeYearlySettings(raw, fallbackYear) {
  const entries = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? Object.entries(raw).filter(([key]) => /^\d{4}$/.test(key))
    : [];

  if (!entries.length) {
    return { [fallbackYear]: createIncomeYearSettings() };
  }

  return Object.fromEntries(entries.map(([year, settings]) => [year, createIncomeYearSettings(settings)]));
}

function getResolvedIncomeYearSettings(incomeModel, year) {
  const model = normalizeIncomeModel(incomeModel);
  const entries = Object.entries(model.yearlySettings)
    .map(([key, value]) => [Number(key), createIncomeYearSettings(value)])
    .sort((left, right) => left[0] - right[0]);

  const exact = entries.find(([entryYear]) => entryYear === year);
  if (exact) return exact[1];

  const previous = [...entries].reverse().find(([entryYear]) => entryYear <= year);
  if (previous) return previous[1];

  return entries[0]?.[1] || createIncomeYearSettings();
}

function getResolvedIncomeYearSource(incomeModel, year) {
  const model = normalizeIncomeModel(incomeModel);
  const years = Object.keys(model.yearlySettings)
    .map(Number)
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);

  if (!years.length) return null;
  if (years.includes(year)) return year;

  const previous = [...years].reverse().find((entryYear) => entryYear <= year);
  return previous ?? years[0];
}

function getPreviousConfiguredIncomeYear(incomeModel, year) {
  const model = normalizeIncomeModel(incomeModel);
  const years = Object.keys(model.yearlySettings)
    .map(Number)
    .filter((value) => Number.isFinite(value) && value < year)
    .sort((left, right) => right - left);

  return years[0] ?? null;
}

function normalizeInvestmentModel(raw, accounts = [], legacy = {}) {
  const base = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw
    : createInvestmentModel(accounts, legacy.startDate, legacy);

  return {
    sourceAccountId: resolveCashAccountId(base.sourceAccountId ?? legacy.investmentSourceAccountId, accounts),
    destinationAccountId: resolveInvestmentAccountId(base.destinationAccountId ?? legacy.brokerageAccountId, accounts),
    retirementAccountId: resolveInvestmentAccountId(base.retirementAccountId, accounts) || getDefaultRetirementAccountId(accounts),
    recurringDayOfMonth: clampDay(base.recurringDayOfMonth ?? legacy.monthlyInvestmentDay ?? parseInvestmentFallbackDay(legacy.startDate)),
    recurringAmount: Math.max(0, Number(base.recurringAmount ?? legacy.monthlyInvestment) || 0),
    startingBrokerageBalance: Math.max(0, Number(base.startingBrokerageBalance) || 0),
    startingRetirementBalance: Math.max(0, Number(base.startingRetirementBalance) || 0),
    annualReturnRate: Number.isFinite(Number(base.annualReturnRate)) ? Number(base.annualReturnRate) : 7,
  };
}

function normalizeMonthlyOverrideEntry(raw) {
  const entry = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const budget = entry.discretionaryBudget;
  const investmentAmount = entry.investmentAmount;
  const investmentDay = entry.investmentDay;

  return {
    discretionaryBudget: Number.isFinite(Number(budget)) ? Math.max(0, Number(budget)) : null,
    investmentAmount: Number.isFinite(Number(investmentAmount)) ? Math.max(0, Number(investmentAmount)) : null,
    investmentDay: Number.isFinite(Number(investmentDay)) ? clampDay(Number(investmentDay)) : null,
  };
}

function normalizeMonthlyOverrides(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .map(([key, value]) => [normalizeMonthPatternKey(key), value])
      .filter(([key]) => key)
      .map(([key, value]) => [key, normalizeMonthlyOverrideEntry(value)])
      .filter(([, value]) => value.discretionaryBudget !== null || value.investmentAmount !== null || value.investmentDay !== null)
  );
}

function getMonthlyOverride(monthlyOverrides, monthKey) {
  const normalized = normalizeMonthlyOverrides(monthlyOverrides);
  return normalizeMonthlyOverrideEntry(normalized[normalizeMonthPatternKey(monthKey)]);
}

function getResolvedMonthPlanValues(plan, monthKey) {
  const rawPlan = plan && typeof plan === 'object' ? plan : {};
  const accounts = normalizeAccounts(rawPlan.accounts);
  const override = getMonthlyOverride(rawPlan.monthlyOverrides, monthKey);
  const investmentModel = normalizeInvestmentModel(rawPlan.investmentModel, accounts, rawPlan);

  return {
    discretionaryBudget: override.discretionaryBudget ?? Math.max(0, Number(rawPlan.monthlyDiscretionaryBudget) || 0),
    investmentAmount: override.investmentAmount ?? Math.max(0, Number(investmentModel.recurringAmount) || 0),
    investmentDay: override.investmentDay ?? clampDay(investmentModel.recurringDayOfMonth),
  };
}

function updateMonthlyOverride(monthlyOverrides, monthKey, patch) {
  const normalized = normalizeMonthlyOverrides(monthlyOverrides);
  const patternKey = normalizeMonthPatternKey(monthKey);
  const current = getMonthlyOverride(normalized, patternKey);
  const next = normalizeMonthlyOverrideEntry({ ...current, ...patch });
  const updated = { ...normalized };

  if (next.discretionaryBudget === null && next.investmentAmount === null && next.investmentDay === null) {
    delete updated[patternKey];
  } else {
    updated[patternKey] = next;
  }

  return updated;
}

function normalizeMonthPatternKey(value) {
  const raw = String(value || '');
  const match = raw.match(/^(?:\d{4}-)?(\d{1,2})$/);
  if (!match) return '';
  const monthNumber = Number(match[1]);
  if (monthNumber < 1 || monthNumber > 12) return '';
  return String(monthNumber).padStart(2, '0');
}

function clampMonth(value) {
  return Math.max(1, Math.min(12, Number(value) || 1));
}

function sumDeductionAmounts(items) {
  return Array.isArray(items) ? items.reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0) : 0;
}

function calculateProgressiveTax(taxableIncome, brackets) {
  const taxable = Math.max(0, Number(taxableIncome) || 0);
  const normalizedBrackets = normalizeTaxBrackets(brackets);
  let total = 0;
  let previousLimit = 0;

  for (const bracket of normalizedBrackets) {
    const upperBound = bracket.upTo === 0 ? taxable : Math.min(taxable, bracket.upTo);
    const taxableSlice = Math.max(0, upperBound - previousLimit);
    total += taxableSlice * ((Number(bracket.rate) || 0) / 100);
    previousLimit = bracket.upTo === 0 ? taxable : bracket.upTo;
    if (taxable <= previousLimit || bracket.upTo === 0) break;
  }

  return total;
}

function isoFromToday(days) {
  return toISODate(addDays(new Date(), days));
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseLocalDate(value) {
  const [year, month, day] = String(value || todayISO()).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function addMonths(date, amount) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + amount);
  return copy;
}

function shiftMonthKeepingDay(date, amount) {
  const monthIndex = date.getMonth() + amount;
  const year = date.getFullYear() + Math.floor(monthIndex / 12);
  const normalizedMonth = ((monthIndex % 12) + 12) % 12;
  return makeClampedDate(year, normalizedMonth, date.getDate());
}

function forEachMonth(start, end, callback) {
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    callback(cursor.getFullYear(), cursor.getMonth());
    cursor.setMonth(cursor.getMonth() + 1);
  }
}

function makeClampedDate(year, monthIndex, dayOfMonth) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(lastDay, Math.max(1, dayOfMonth)));
}

function inferStatementDateForDueDate(dueDate, statementDay, dueDay) {
  const baseMonthIndex = dueDate.getMonth() + (dueDay >= statementDay ? 0 : -1);
  const year = dueDate.getFullYear() + Math.floor(baseMonthIndex / 12);
  const normalizedMonth = ((baseMonthIndex % 12) + 12) % 12;
  return makeClampedDate(year, normalizedMonth, statementDay);
}

function selectChartAnnotations(events) {
  const priority = { current: 4, accrued: 3, 'card-payment': 2, expense: 2, income: 1, estimated: 1 };
  const chosen = [];

  for (const event of events
    .slice()
    .sort((a, b) => (priority[b.cardPhase || b.type] || 0) - (priority[a.cardPhase || a.type] || 0) || a.date - b.date)) {
    if (chosen.some((existing) => Math.abs(existing.x - event.x) < 88)) continue;
    chosen.push(event);
    if (chosen.length === 6) break;
  }

  return chosen
    .sort((a, b) => a.x - b.x)
    .map((event, index) => ({
      ...event,
      lane: index % 3,
      placement: index % 2 === 0 ? 'top' : 'bottom',
    }));
}

function buildBalanceAxisTicks(min, max, desiredTickCount = 5) {
  if (min === max) {
    const offset = min === 0 ? 100 : Math.abs(min) * 0.2;
    min -= offset;
    max += offset;
  }

  const range = niceAxisNumber(max - min, false);
  const step = niceAxisNumber(range / Math.max(1, desiredTickCount - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];

  for (let value = niceMin; value <= niceMax + step * 0.5; value += step) {
    ticks.push(roundAxisValue(value));
  }

  return ticks;
}

function niceAxisNumber(value, round) {
  const exponent = Math.floor(Math.log10(Math.max(Math.abs(value), 1)));
  const fraction = Math.abs(value) / 10 ** exponent;
  let niceFraction;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * 10 ** exponent;
}

function roundAxisValue(value) {
  return Math.abs(value) < 1e-9 ? 0 : Number(value.toFixed(6));
}

function buildMonthAxisTicks(timeline, toX) {
  if (!timeline.length) return [];

  const totalDays = (timeline.at(-1).date.getTime() - timeline[0].date.getTime()) / 86400000;

  if (totalDays <= 93) {
    // Short window: weekly ticks
    const ticks = [];
    const seen = new Set();
    timeline.forEach((point, index) => {
      const d = point.date;
      const dayOfWeek = (d.getDay() + 6) % 7;
      const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek);
      const weekKey = `${monday.getFullYear()}-${monday.getMonth()}-${monday.getDate()}`;
      if (!seen.has(weekKey)) {
        seen.add(weekKey);
        ticks.push({
          key: weekKey,
          index,
          date: d,
          x: toX(index),
          label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d),
        });
      }
    });
    return ticks;
  }

  const monthStarts = [];
  let previousKey = '';

  timeline.forEach((point, index) => {
    const key = `${point.date.getFullYear()}-${point.date.getMonth()}`;
    if (key !== previousKey) {
      monthStarts.push({ key, index, date: point.date });
      previousKey = key;
    }
  });

  const step = Math.max(1, Math.ceil(monthStarts.length / 8));
  const selected = monthStarts.filter((_, index) => index % step === 0);
  const last = monthStarts.at(-1);
  if (last && !selected.some((tick) => tick.key === last.key)) {
    selected.push(last);
  }

  return selected.map((tick) => ({
    ...tick,
    x: toX(tick.index),
    label: formatAxisMonth(tick.date),
  }));
}

function formatAxisMonth(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(date);
}

function getChartAccountColor(index) {
  const palette = ['#73f0b2', '#ffbe6e', '#ff8d8d', '#b89cff', '#7ad7ff', '#f59ed8'];
  return palette[index % palette.length];
}

const CALENDAR_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CALENDAR_EVENT_KIND_ORDER = ['income', 'expense', 'card-payment', 'investment'];

function buildCalendarMonths(startDate, endDate) {
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime()) || !(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
    return [];
  }

  const months = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const finalMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= finalMonth) {
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const days = Array.from({ length: firstDay.getDay() }, () => null);

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
      const date = new Date(year, monthIndex, dayNumber);
      days.push({
        key: toISODate(date),
        date,
      });
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    months.push({
      key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      label: formatMonth(firstDay),
      days,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function getCalendarEventKindMeta(kind) {
  if (kind === 'income') return { label: 'Paycheck', shortLabel: 'Pay' };
  if (kind === 'expense') return { label: 'Bill', shortLabel: 'Bill' };
  if (kind === 'card-payment') return { label: 'Card payment', shortLabel: 'Card' };
  if (kind === 'investment') return { label: 'Investing', shortLabel: 'Invest' };
  return { label: 'Event', shortLabel: 'Event' };
}

function summarizeCalendarDayKinds(events) {
  const kinds = CALENDAR_EVENT_KIND_ORDER.filter((kind) => events.some((event) => event.type === kind));
  return kinds.slice(0, 3).map((kind) => ({
    kind,
    ...getCalendarEventKindMeta(kind),
  }));
}

function chartAnnotationLabel(event) {
  const raw = event.shortLabel || event.label || '';
  return raw.length > 22 ? `${raw.slice(0, 19)}...` : raw;
}

function cardPhaseLabel(phase) {
  if (phase === 'current') return 'Next due';
  if (phase === 'accrued') return 'In flight';
  if (phase === 'estimated') return 'Estimated';
  return 'Card';
}

function parseEditableNumber(raw, integer = false) {
  if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return null;
  const parsed = integer ? parseInt(raw, 10) : Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatEditableNumber(value, integer = false) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  return integer ? String(Math.round(numeric)) : String(numeric);
}

function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

function formatClockTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default BalancePlanner;
