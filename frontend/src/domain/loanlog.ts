// '대출 기록' 문서: 잔금 뒤 달마다 냈는지, 금고에 실제로 갚은 돈, 금리가 바뀐 달.
// 적지 않은 달은 계획대로 계산한다.
import type { Month } from './pay';

export type LoanKind = 'co' | 'gg';
export interface RateChange { id: string; month: Month; loan: LoanKind; rate: number }
export interface MonthLog { paid?: boolean; ggRepay?: number }
export interface LoansDoc { months: Record<Month, MonthLog>; rates: RateChange[] }

export const EMPTY_LOANS: LoansDoc = { months: {}, rates: [] };

const isMonth = (k: unknown): k is Month => typeof k === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(k);
const money = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

function monthLog(raw: unknown): MonthLog | null {
  const o = obj(raw);
  const log: MonthLog = {};
  if (o.paid === true) log.paid = true;
  const repay = money(o.ggRepay);
  if (repay !== undefined) log.ggRepay = repay;
  return Object.keys(log).length ? log : null;
}

function rateChange(raw: unknown): RateChange | null {
  const o = obj(raw);
  const rate = o.rate;
  if (!isMonth(o.month) || (o.loan !== 'co' && o.loan !== 'gg')) return null;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 0.3) return null;
  return { id: typeof o.id === 'string' && o.id ? o.id.slice(0, 40) : crypto.randomUUID(), month: o.month, loan: o.loan, rate };
}

/** 저장된 값에서 형식이 맞는 것만 남긴다 */
export function normalizeLoans(raw: unknown): LoansDoc {
  const o = obj(raw);
  const months: Record<Month, MonthLog> = {};
  for (const [k, v] of Object.entries(obj(o.months))) {
    const log = isMonth(k) ? monthLog(v) : null;
    if (log) months[k] = log;
  }
  const rates = (Array.isArray(o.rates) ? o.rates : []).map(rateChange).filter((x): x is RateChange => x !== null);
  return { months, rates };
}

/** 한 달 기록 고치기. 빈 기록은 지운다 (undefined 값은 그 항목을 지운다) */
export function patchMonth(doc: LoansDoc, month: Month, patch: MonthLog): LoansDoc {
  const next: MonthLog = { ...doc.months[month], ...patch };
  if (!next.paid) delete next.paid;
  if (next.ggRepay === undefined) delete next.ggRepay;
  const months = { ...doc.months };
  if (Object.keys(next).length) months[month] = next;
  else delete months[month];
  return { ...doc, months };
}

/** 그 달에 적용되는 금리: 그 달까지 바뀐 것 중 가장 늦은 것, 없으면 기본값 */
export function rateAt(changes: RateChange[], loan: LoanKind, month: Month, base: number): number {
  let best: RateChange | null = null;
  for (const c of changes) {
    if (c.loan === loan && c.month <= month && (!best || c.month >= best.month)) best = c;
  }
  return best ? best.rate : base;
}
