// 퇴직금 중간정산과 퇴직소득세 (2023년 이후 퇴직분 기준). 금액은 만원
import type { Ymd } from './schedule';

const BRACKETS: [number, number, number][] = [
  [1400, 0.06, 0], [5000, 0.15, 126], [8800, 0.24, 576], [15000, 0.35, 1544],
  [30000, 0.38, 1994], [50000, 0.4, 2594], [100000, 0.42, 3594], [Infinity, 0.45, 6594],
];

export function incomeTax(base: number): number {
  const [, rate, deduct] = BRACKETS.find(([cap]) => base <= cap)!;
  return Math.max(0, base * rate - deduct);
}

/** 근속연수공제 */
function serviceDeduction(y: number): number {
  if (y <= 5) return 100 * y;
  if (y <= 10) return 500 + 200 * (y - 5);
  if (y <= 20) return 1500 + 250 * (y - 10);
  return 4000 + 300 * (y - 20);
}

/** 환산급여공제 */
function convertedDeduction(c: number): number {
  if (c <= 800) return c;
  if (c <= 7000) return 800 + (c - 800) * 0.6;
  if (c <= 10000) return 4520 + (c - 7000) * 0.55;
  if (c <= 30000) return 6170 + (c - 10000) * 0.45;
  return 15170 + (c - 30000) * 0.35;
}

export type RetirePlan = 'severance' | 'dc' | 'db';

export interface RetireInput {
  plan: RetirePlan; start: Ymd; date: Ymd; pay: number; quote: number; use: boolean;
}

export interface Severance {
  days: number; years: number; amount: number; tax: number; local: number;
  net: number; allowed: boolean; estimated: boolean;
}

/** pay: 월 평균임금, quote: 회사에서 조회한 금액(있으면 우선) */
export function severance(r: RetireInput): Severance | null {
  if (!r.start || !r.date) return null;
  const days = Math.floor((Date.parse(r.date) - Date.parse(r.start)) / 86_400_000) + 1;
  if (!(days > 0)) return null;
  const amount = r.quote > 0 ? r.quote : ((r.pay || 0) * days) / 365;
  const years = Math.ceil(days / 365);
  const converted = (Math.max(0, amount - serviceDeduction(years)) * 12) / years;
  const tax = (incomeTax(Math.max(0, converted - convertedDeduction(converted))) * years) / 12;
  const local = tax * 0.1;
  return {
    days, years, amount, tax, local, net: amount - tax - local,
    allowed: r.plan !== 'db', estimated: !(r.quote > 0),
  };
}
