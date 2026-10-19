// 달마다 받는 월급 (실수령, 만원).
// 적은 달은 그 값을 쓰고, 안 적은 달은 가정의 '월 실수령(둘 합계)'을 계약연봉 비율로 나눠 쓴다.
import { paydayDates, type Ymd } from './schedule';

export type Month = string; // 'YYYY-MM'
export type MonthPay = Record<Month, number>;
export interface PayEntries { a: MonthPay; b: MonthPay }
export interface Shares { a: number; b: number }
export interface PayRow { month: Month; date: Ymd; entered: number | undefined; amount: number }

export const NO_PAY: PayEntries = { a: {}, b: {} };
export const monthOf = (date: Ymd): Month => date.slice(0, 7);
const isMonth = (k: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(k);

export function payShares(salA: number, salB: number): Shares {
  const sum = salA + salB;
  const a = sum > 0 ? salA / sum : 0.5;
  return { a, b: 1 - a };
}

/** 그 달 두 사람 합계. 둘 다 안 적었으면 가정 값 그대로 (나눴다 더할 때 생기는 오차가 없게) */
export function monthTotal(month: Month, pay: PayEntries, netMonth: number, shares: Shares): number {
  const a = pay.a[month];
  const b = pay.b[month];
  if (a === undefined && b === undefined) return netMonth;
  return (a ?? netMonth * shares.a) + (b ?? netMonth * shares.b);
}

/** 월급날 목록 동안 두 사람이 받는 월급 합계 */
export function householdPay(dates: Ymd[], pay: PayEntries, netMonth: number, shares: Shares): number {
  return dates.reduce((sum, date) => sum + monthTotal(monthOf(date), pay, netMonth, shares), 0);
}

/** 한 사람의 월급날별 줄: 적은 값이 없으면 기본값으로 계산한다 */
export function personPayRows(dates: Ymd[], pay: MonthPay, fallback: number): PayRow[] {
  return dates.map((date) => {
    const month = monthOf(date);
    const entered = pay[month];
    return { month, date, entered, amount: entered ?? fallback };
  });
}

export interface PayPlanInput { asOf: Ymd; closingDate: Ymd; payday: number; netMonth: number; salA: number; salB: number }

/** 한 사람의 잔금 전 월급: 기본값, 월급날별 줄, 합계 */
export function personPay(s: PayPlanInput, who: keyof Shares, pay: MonthPay) {
  const fallback = s.netMonth * payShares(s.salA, s.salB)[who];
  const rows = personPayRows(paydayDates(s.asOf, s.closingDate, s.payday), pay, fallback);
  return { fallback, rows, total: rows.reduce((sum, r) => sum + r.amount, 0) };
}

/** 한 달 값 바꾸기. 0이나 빈칸이면 지워서 기본값을 쓴다 */
export function withMonthPay(pay: MonthPay, month: Month, value: number): MonthPay {
  const next = { ...pay };
  if (value > 0) next[month] = value;
  else delete next[month];
  return next;
}

/** 저장된 값에서 'YYYY-MM': 양수만 남긴다 */
export function cleanMonthPay(raw: unknown): MonthPay {
  const out: MonthPay = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw)) {
    if (isMonth(k) && typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = v;
  }
  return out;
}
