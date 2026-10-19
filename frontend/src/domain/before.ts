// 잔금 전 달마다 들어오고 나가는 돈. 지금 자산에서 시작해 월급(적은 달은 그 값)·성과급이 들어오고,
// 생활비·계약금이 나가고, 잔금일에 우리 몫(계약금 뺀)과 부대비용을 낸다. 끝 잔액에서 비상금을 빼면 잔금 판정과 같다.
import type { Closing } from './closing';
import { monthAfter } from './loans';
import { monthOf, monthTotal, payShares, type Month, type PayEntries } from './pay';
import type { Scenario } from './scenario';
import { paydayDates, parseYmd, type Ymd } from './schedule';

export interface FlowItem { label: string; amount: number; date: Ymd }
export interface FlowMonth { month: Month; items: FlowItem[]; net: number; balance: number; closing: boolean }

function monthsBetween(from: Ymd, to: Ymd): Month[] {
  const a = parseYmd(from);
  const b = parseYmd(to);
  const n = (b.y - a.y) * 12 + (b.m - a.m);
  return Array.from({ length: n + 1 }, (_, k) => monthAfter(a.y, a.m, k));
}

const clamp = (d: Ymd, lo: Ymd, hi: Ymd) => (d < lo ? lo : d > hi ? hi : d);

function events(s: Scenario, c: Closing, pay: PayEntries): FlowItem[] {
  const shares = payShares(s.salA, s.salB);
  const items: FlowItem[] = [];
  for (const date of paydayDates(s.asOf, s.closingDate, s.payday)) {
    items.push({ label: '월급', amount: monthTotal(monthOf(date), pay, s.netMonth, shares), date });
    items.push({ label: '생활비', amount: -s.living, date });
  }
  if (s.piDue) items.push({ label: 'PI', amount: c.inflows.pi, date: s.piDate });
  if (s.psDue) items.push({ label: 'PS (세후)', amount: c.inflows.ps, date: s.psDate });
  if (s.holidayDue) items.push({ label: '명절 근무비 (세후)', amount: c.inflows.holiday, date: s.holidayDate });
  if (!s.depositPaid) items.push({ label: '계약금', amount: -c.deposit, date: clamp(s.depositDate, s.asOf, s.closingDate) });
  items.push({ label: '잔금·부대비용', amount: -(c.own + c.costSum - c.deposit), date: s.closingDate });
  return items.filter((x) => x.amount !== 0).sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
}

/** 잔금이 지났으면 빈 목록 */
export function beforeFlow(s: Scenario, c: Closing, pay: PayEntries): FlowMonth[] {
  if (s.asOf >= s.closingDate) return [];
  const items = events(s, c, pay);
  const closingMonth = monthOf(s.closingDate);
  let balance = s.have;
  return monthsBetween(s.asOf, s.closingDate).map((month) => {
    const mine = items.filter((x) => monthOf(x.date) === month);
    const net = mine.reduce((sum, x) => sum + x.amount, 0);
    balance += net;
    return { month, items: mine, net, balance, closing: month === closingMonth };
  });
}
