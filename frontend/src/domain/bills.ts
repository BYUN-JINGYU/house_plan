// 다가오는 돈 일정 (오늘이 든 달부터 n달).
// 잔금 전: 성과급·계약금·잔금. 잔금 뒤: 달마다 대출·관리비, 금고 상환.
// 날짜가 정해진 것: 취득세 신고 기한(잔금일부터 60일), 재산세(그해 6월 1일에 집이 있으면 7월·9월 절반씩), 금고 만기, 사내대출 원리금 시작.
import type { PlanModel } from './compute';
import { won } from './format';
import { monthAfter } from './loans';
import { monthOf, type Month } from './pay';
import { daysBetween, parseYmd, ymd, type Ymd } from './schedule';

export interface Bill { day: number | null; label: string; amount: number; note?: string }
export interface BillMonth { month: Month; items: Bill[] }

function addDays(d: Ymd, n: number): Ymd {
  const { y, m, d: day } = parseYmd(d);
  const t = new Date(Date.UTC(y, m - 1, day + n));
  return ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function upcoming(m: PlanModel, n = 12): BillMonth[] {
  const { s, c, flow, loans } = m;
  const start = parseYmd(s.asOf);
  const months = Array.from({ length: n }, (_, k) => monthAfter(start.y, start.m, k));
  const items: { month: Month; bill: Bill }[] = [];
  const at = (date: Ymd, label: string, amount: number, note?: string) =>
    items.push({ month: monthOf(date), bill: { day: parseYmd(date).d, label, amount, note } });
  const monthly = (month: Month, label: string, amount: number, note?: string) => items.push({ month, bill: { day: null, label, amount, note } });

  flow.flatMap((r) => r.items).filter((x) => x.label !== '월급' && x.label !== '생활비').forEach((x) => at(x.date, x.label, x.amount));
  if (daysBetween(s.asOf, s.closingDate) > -60) at(addDays(s.closingDate, 60), '취득세 신고·납부 기한', 0, `잔금·부대비용 안의 ${won(c.costs.acq)}, 보통 잔금 때 법무사가 같이 내요`);
  for (const r of loans) {
    if (r.month < s.closingDate.slice(0, 7)) continue;
    monthly(r.month, '대출 이자·원금·세금', -r.due);
    if (s.upkeep > 0) monthly(r.month, '관리비·공과금', -s.upkeep);
    if (r.ggRepay > 0) monthly(r.month, r.entered ? '금고 상환' : '금고 상환 (계획)', -r.ggRepay);
    if (r.maturity) monthly(r.month, '금고 만기', -r.ggBal, r.ggBal > 0.5 ? '남은 돈을 갚거나 연장해요' : undefined);
    if (r.coPrin > 0 && r.i === Math.round(s.coGrace * 12)) monthly(r.month, '사내대출 원리금 시작', 0, '이달부터 원금도 내요');
  }
  const close = parseYmd(s.closingDate);
  for (let y = close.y; y <= close.y + 2; y += 1) {
    if (ymd(y, 6, 1) < s.closingDate) continue;
    at(ymd(y, 7, 31), '재산세 (절반)', -s.propTax / 2);
    at(ymd(y, 9, 30), '재산세 (절반)', -s.propTax / 2);
  }
  return months.map((month) => ({
    month,
    items: items.filter((x) => x.month === month).map((x) => x.bill).sort((x, y) => (x.day ?? 99) - (y.day ?? 99)),
  }));
}
