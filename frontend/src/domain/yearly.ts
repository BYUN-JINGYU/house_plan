// 잔금 후 연도별 흐름 (잔금 달 ~ 다음 해 그 전달). 남는 돈은 금고부터 갚고, 다 갚으면 모은다.
import { ggTotal } from './closing';
import type { Scenario } from './scenario';

export const YEARS = 13;

export interface YearRow {
  t: number; period: string; tranche: number; coPay: number; lowTax: number;
  ggInt: number; surplus: number; ggEnd: number; coEnd: number; saved: number;
}

const whole = (n: number) => Math.max(1, Math.round(n));

function companyLoan(s: Scenario) {
  const i = s.coRate / 12;
  const n = whole(s.coTerm * 12);
  const pmt = i ? (s.coLoan * i) / (1 - (1 + i) ** -n) : s.coLoan / n;
  const balance = (m: number) => {
    if (m >= n) return 0;
    return i ? s.coLoan * (1 + i) ** m - (pmt * ((1 + i) ** m - 1)) / i : s.coLoan - pmt * m;
  };
  return { pmt, balance };
}

/** t년째 기간 이름: 잔금이 2027년 4월이면 1년째는 "2027.4~2028.3" */
export function periodLabel(s: Scenario, t: number): string {
  const start = s.closeYear + t - 1;
  const m = s.closeMonth;
  return m === 1 ? `${start}.1~${start}.12` : `${start}.${m}~${start + 1}.${m - 1}`;
}

export function simulate(s: Scenario, bonus = s.bonus): YearRow[] {
  const { pmt, balance } = companyLoan(s);
  const parts = whole(s.opi2N);
  let gg = ggTotal(s);
  let saved = 0;
  let coPrev = s.coLoan;
  const rows: YearRow[] = [];
  for (let t = 1; t <= YEARS; t += 1) {
    const coEnd = t <= s.coGrace ? s.coLoan : Math.max(0, balance(12 * (t - s.coGrace)));
    const income = 12 * s.netMonth + (s.salA + s.salB) * s.psLater * s.netRatio + s.pi;
    const tranche = t <= parts ? (bonus / parts) * (1 + s.stockChg) : 0;
    const coPay = t <= s.coGrace ? s.coLoan * s.coRate : t <= s.coGrace + s.coTerm ? 12 * pmt : 0;
    const lowTax = (((s.fairRate - s.coRate) * (coPrev + coEnd)) / 2) * s.marginal;
    const ggInt = Math.max(gg - tranche, 0) * s.ggRate;
    const fixed = 12 * (s.living + s.upkeep) + s.propTax;
    const surplus = income - fixed - coPay - lowTax - ggInt;
    const repay = Math.min(gg, tranche + Math.max(surplus, 0));
    gg -= repay;
    saved += tranche + surplus - repay;
    rows.push({ t, period: periodLabel(s, t), tranche, coPay, lowTax, ggInt, surplus, ggEnd: gg, coEnd, saved });
    coPrev = coEnd;
  }
  return rows;
}

function leftAtMaturity(s: Scenario, rows: YearRow[]): number {
  const term = whole(s.ggTerm);
  return Math.max((rows[term - 1]?.ggEnd ?? 0) - (rows[term]?.tranche ?? 0), 0);
}

/** 금고를 만기까지 다 갚는 데 필요한 특별성과급 세후 합계 (못 갚으면 null) */
export function bonusNeeded(s: Scenario): number | null {
  const left = (x: number) => leftAtMaturity(s, simulate(s, x));
  if (left(0) <= 0.5) return 0;
  let lo = 0;
  let hi = ggTotal(s) * 4 + 1;
  if (left(hi) > 0.5) return null;
  for (let k = 0; k < 40; k += 1) {
    const mid = (lo + hi) / 2;
    if (left(mid) > 0.5) lo = mid; else hi = mid;
  }
  return hi;
}

export interface Outlook {
  rows: YearRow[];
  atMaturity: number;
  payoff: string | null;
  afterGrace: YearRow;
  bonusNeeded: number | null;
}

export function outlook(s: Scenario): Outlook {
  const rows = simulate(s);
  const open = rows.filter((r) => r.ggEnd > 0.5).length;
  return {
    rows,
    atMaturity: leftAtMaturity(s, rows),
    payoff: open >= YEARS ? null : rows[open].period,
    afterGrace: rows[Math.min(YEARS - 1, Math.round(s.coGrace))],
    bonusNeeded: bonusNeeded(s),
  };
}

/** 월 실수령이 어디로 가는지 (성과급 제외). row = 그해 simulate 결과 */
export function monthlyGroups(s: Scenario, row: YearRow) {
  const house = s.upkeep + s.propTax / 12;
  const debt = (row.coPay + row.lowTax + row.ggInt) / 12;
  return { income: s.netMonth, living: s.living, house, debt, left: s.netMonth - s.living - house - debt };
}
