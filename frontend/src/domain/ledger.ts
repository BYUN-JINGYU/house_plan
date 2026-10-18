// 가계부 계산. 금액은 원
import type { Ymd } from './schedule';

export type EntryKind = 'in' | 'out';
export type Who = '' | 'a' | 'b';

export interface LedgerEntry {
  id: number; day: Ymd; kind: EntryKind; category: string; amount: number; who: Who; memo: string;
}
export type NewEntry = Omit<LedgerEntry, 'id'>;

export const LEDGER_CATS: Record<EntryKind, string[]> = {
  in: ['월급', '성과급', '기타 수입'],
  out: ['생활비', '주거·관리비', '대출 상환', '보험', '교통·통신', '경조사·용돈', '기타 지출'],
};
/** 생활비 가정과 비교할 때 빼는 지출 (계산에서 따로 다루는 것) */
export const NOT_LIVING = ['주거·관리비', '대출 상환'];

export type Month = string; // 'YYYY-MM'

export const monthOf = (day: Ymd): Month => day.slice(0, 7);

export function shiftMonth(m: Month, delta: number): Month {
  const [y, mm] = m.split('-').map(Number);
  const idx = y * 12 + (mm - 1) + delta;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
}

export function monthRange(m: Month): { from: Ymd; to: Ymd } {
  const [y, mm] = m.split('-').map(Number);
  const last = new Date(Date.UTC(y, mm, 0)).getUTCDate();
  return { from: `${m}-01`, to: `${m}-${String(last).padStart(2, '0')}` };
}

export function monthLabel(m: Month): string {
  const [y, mm] = m.split('-').map(Number);
  return `${y}년 ${mm}월`;
}

/** end를 포함해 앞으로 n달 (오래된 달부터) */
export const lastMonths = (end: Month, n: number): Month[] =>
  Array.from({ length: n }, (_, i) => shiftMonth(end, i - n + 1));

export interface MonthTotal { month: Month; income: number; spend: number; left: number }

export function monthTotals(entries: LedgerEntry[], months: Month[]): MonthTotal[] {
  return months.map((month) => {
    const mine = entries.filter((e) => monthOf(e.day) === month);
    const income = mine.filter((e) => e.kind === 'in').reduce((s, e) => s + e.amount, 0);
    const spend = mine.filter((e) => e.kind === 'out').reduce((s, e) => s + e.amount, 0);
    return { month, income, spend, left: income - spend };
  });
}

export function categoryTotals(entries: LedgerEntry[], month: Month, kind: EntryKind = 'out') {
  const sums = new Map<string, number>();
  for (const e of entries) {
    if (e.kind === kind && monthOf(e.day) === month) sums.set(e.category, (sums.get(e.category) ?? 0) + e.amount);
  }
  return [...sums.entries()].map(([category, amount]) => ({ category, amount })).sort((x, y) => y.amount - x.amount);
}

/** 생활비 평균(원): 지출 기록이 있는 달만, 계산에서 따로 다루는 지출은 빼고 */
export function averageLiving(entries: LedgerEntry[], months: Month[]): { avg: number; count: number } {
  const living = entries.filter((e) => e.kind === 'out' && !NOT_LIVING.includes(e.category));
  const sums = months.map((m) => living.filter((e) => monthOf(e.day) === m).reduce((s, e) => s + e.amount, 0));
  const used = sums.filter((v) => v > 0);
  return { avg: used.length ? used.reduce((s, v) => s + v, 0) / used.length : 0, count: used.length };
}
