// 3단계: 위기 시험, 증권 구성·해 나눠 팔기, 돈 일정, 점검할 것
import { describe, expect, it } from 'vitest';
import { withOverrides } from './assumptions';
import { upcoming } from './bills';
import { withPhase } from './checks';
import { computeFrom, type PlanInputs } from './compute';
import { insights } from './insights';
import { EMPTY_LOANS } from './loanlog';
import { normalizePeople } from './people';
import { DEFAULT_PLAN, type PlanDoc } from './plan';
import { portfolio } from './portfolio';
import { stressTest } from './stress';

const quote = (price: number) => ({ price, currency: 'KRW', asOf: '2026-10-16', source: 'pykrx', fetchedAt: '', stale: false });
const people = normalizePeople({
  a: { banks: [{ id: 'k', name: '통장', amount: 30000 }], opi2: 10000,
    brokers: [{ id: 'b', name: '증권', krFee: 0, usFee: 0, fxFee: 0, holdings: [
      { id: 'h1', market: 'KR', code: '005930', name: '큰 종목', qty: 1000, avg: 50000, fxBuy: 0, manual: 0 },
      { id: 'h2', market: 'KR', code: '000660', name: '작은 종목', qty: 10, avg: 100000, fxBuy: 0, manual: 0 },
    ] }] },
});
const book = { 'KR:005930': quote(60000), 'KR:000660': quote(200000) };
const plan = (over = {}): PlanDoc => ({ ...DEFAULT_PLAN, overrides: { ...DEFAULT_PLAN.overrides, ...over } });
const inputs = (over = {}): PlanInputs => ({ plan: plan(over), people, book, asOf: '2026-10-19', log: EMPTY_LOANS });

describe('위기 시험', () => {
  const t = stressTest(inputs());
  const row = (id: string) => t.rows.find((r) => r.id === id)!;

  it('PS 0%면 잔금 판정이 PS 세후만큼 나빠진다', () => {
    const base = computeFrom(inputs());
    expect(row('ps0').d.gap).toBeCloseTo(-base.c.inflows.ps);
  });

  it('금고 금리 +1%p면 잔금 뒤 매달 (금고 − 첫해 특별성과급 매도분) × 1% ÷ 12만큼 덜 남는다', () => {
    const a = withOverrides({});
    const tranche = computeFrom(inputs()).o.rows[0].tranche;
    expect(row('gg1').d.monthly).toBeCloseTo(-((a.ggA + a.ggB - tranche) * 0.01) / 12);
  });

  it('한 사람 월급 3달 끊김 = 월 실수령 × 그 사람 몫 × 3', () => {
    expect(row('pay3').d.gap).toBeCloseTo(-3 * 900 * 0.5);
  });

  it('주가 −20%면 국내 주식은 팔면 받는 돈의 20%만큼 나빠진다', () => {
    const base = computeFrom(inputs());
    expect(row('stock').d.gap).toBeCloseTo(-0.2 * base.hh.a.stocks.afterTax);
  });
});

describe('증권 구성', () => {
  const m = computeFrom(inputs());
  const p = portfolio(people.a.brokers, m.hh.a.stocks, m.rates);

  it('큰 순서, 비중 합은 1, 가장 큰 종목', () => {
    expect(p.slices.map((x) => x.label)).toEqual(['큰 종목', '작은 종목']);
    expect(p.slices.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1);
    expect(p.top?.share).toBeCloseTo(6000 / 6200);
    expect(p.usShare).toBe(0);
  });

  it('해외 차익을 두 해에 나눠 팔면: 공제를 두 번 받는 만큼 아낀다', () => {
    const us = portfolio([], { ...m.hh.a.stocks, usGain: 1000 }, { ...m.rates, usDeduct: 250, usTaxRate: 0.22 });
    expect(us.taxAll).toBeCloseTo(165);
    expect(us.saving).toBeCloseTo(55);
  });
});

describe('돈 일정', () => {
  it('잔금 전 일정, 취득세 기한(잔금+60일), 6월 1일에 집이 없으면 그해 재산세 없음', () => {
    const months = upcoming(computeFrom(inputs()), 12);
    const all = months.flatMap((x) => x.items.map((b) => `${x.month} ${b.label}`));
    expect(all).toContain('2027-02 계약금');
    expect(all).toContain('2027-06 잔금·부대비용');
    expect(all).toContain('2027-08 취득세 신고·납부 기한');
    expect(all.some((x) => x.includes('재산세'))).toBe(false);
  });

  it('6월 1일 전에 잔금이면 7월·9월 재산세', () => {
    const months = upcoming(computeFrom(inputs({ closingDate: '2027-04-01' })), 12);
    const tax = months.flatMap((x) => x.items.filter((b) => b.label.startsWith('재산세')).map(() => x.month));
    expect(tax).toEqual(['2027-07', '2027-09']);
  });
});

describe('단계별 할 일', () => {
  it('묶음을 한 번에 더하고, 이미 있는 것은 건너뛴다', () => {
    const once = withPhase([], 'closing');
    expect(once.length).toBeGreaterThan(3);
    expect(once.every((x) => x.group === '구입일' && !x.done)).toBe(true);
    expect(withPhase(once, 'closing')).toHaveLength(once.length);
    expect(withPhase(once, 'after').length).toBeGreaterThan(once.length);
  });
});

describe('점검할 것', () => {
  it('자산이 없으면 맨 먼저 자산 넣기', () => {
    const empty = { ...inputs(), people: normalizePeople({}) };
    const m = computeFrom(empty);
    expect(insights(m, stressTest(empty), [])[0]).toMatchObject({ id: 'assets', tone: 'warn', tab: 'assets' });
  });

  it('PS 비중, 금고 만기, 한 종목 쏠림, 회사 주식 비중을 짚고 5개까지만', () => {
    const m = computeFrom(inputs());
    const p = portfolio(people.a.brokers, m.hh.a.stocks, m.rates);
    const list = insights(m, stressTest(inputs()), [{ name: '가람', p }]);
    const ids = list.map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining(['maturity', 'top-가람']));
    expect(list.length).toBeLessThanOrEqual(5);
    expect(list.every((x) => x.text.length < 60)).toBe(true);
  });
});
