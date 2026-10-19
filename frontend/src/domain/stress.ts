// 위기 시험: 나쁜 일이 생기면 세 숫자가 얼마나 바뀌는지.
// 세 숫자 = 잔금 여유·부족, 잔금 뒤 매달 남는 돈(첫해), 금고 만기에 남는 돈. 계획을 조금씩 바꿔 처음부터 다시 센다.
import { withOverrides, type Assumptions, type Overrides } from './assumptions';
import { computeFrom, type PlanInputs, type PlanModel } from './compute';
import { monthOf, type MonthPay } from './pay';
import type { Person } from './people';
import { paydayDates } from './schedule';
import { monthlyGroups } from './yearly';

export interface Outcome { gap: number; monthly: number; maturity: number }
export interface StressRow extends Outcome { id: string; label: string; d: Outcome }
export interface StressResult { base: Outcome; rows: StressRow[] }

export const outcome = (m: PlanModel): Outcome =>
  ({ gap: m.c.gap, monthly: monthlyGroups(m.s, m.o.rows[0]).left, maturity: m.loanSum.atMaturity });

function over(x: PlanInputs, patch: (a: Assumptions) => Overrides): PlanInputs {
  const a = withOverrides(x.plan.overrides);
  return { ...x, plan: { ...x.plan, overrides: { ...x.plan.overrides, ...patch(a) } } };
}

/** 주가가 k만큼 내림: 시세·직접 넣은 현재가·특별성과급 팔 때 주가 모두 */
const stockDrop = (k: number) => (x: PlanInputs): PlanInputs => {
  const book = Object.fromEntries(Object.entries(x.book).map(([key, q]) => [key, key.startsWith('FX:') ? q : { ...q, price: q.price * (1 - k) }]));
  const scale = (p: Person): Person => ({
    ...p, brokers: p.brokers.map((b) => ({ ...b, holdings: b.holdings.map((h) => ({ ...h, manual: h.manual * (1 - k) })) })),
  });
  return over({ ...x, book, people: { a: scale(x.people.a), b: scale(x.people.b) } }, (a) => ({ stockChg: a.stockChg - k }));
};

/** 연봉이 큰 사람의 잔금 전 월급 n번이 0 */
const payGap = (n: number) => (x: PlanInputs): PlanInputs => {
  const a = withOverrides(x.plan.overrides);
  const who = a.salA >= a.salB ? 'a' : 'b';
  const pay: MonthPay = { ...x.people[who].pay };
  for (const date of paydayDates(x.asOf, a.closingDate, a.payday).slice(0, n)) pay[monthOf(date)] = 0;
  return { ...x, people: { ...x.people, [who]: { ...x.people[who], pay } } };
};

const CASES: { id: string; label: string; apply: (x: PlanInputs) => PlanInputs }[] = [
  { id: 'gg1', label: '금고 금리 +1%p', apply: (x) => over(x, (a) => ({ ggRate: a.ggRate + 0.01 })) },
  { id: 'gg2', label: '금고 금리 +2%p', apply: (x) => over(x, (a) => ({ ggRate: a.ggRate + 0.02 })) },
  { id: 'ps0', label: '잔금 전 PS 0%', apply: (x) => over(x, () => ({ ps2027: 0 })) },
  { id: 'stock', label: '주가 −20%', apply: stockDrop(0.2) },
  { id: 'pay3', label: '한 사람 월급 3달 끊김', apply: payGap(3) },
  { id: 'living', label: '생활비 +20%', apply: (x) => over(x, (a) => ({ living: a.living * 1.2 })) },
];

export function stressTest(x: PlanInputs): StressResult {
  const base = outcome(computeFrom(x));
  const rows = CASES.map(({ id, label, apply }) => {
    const o = outcome(computeFrom(apply(x)));
    return { id, label, ...o, d: { gap: o.gap - base.gap, monthly: o.monthly - base.monthly, maturity: o.maturity - base.maturity } };
  });
  return { base, rows };
}
