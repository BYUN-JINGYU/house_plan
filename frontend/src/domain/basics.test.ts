// 표시·입력 형식, 날짜, 가계부, 타임라인, 전체 계산
import { describe, expect, it } from 'vitest';
import { computePlan } from './compute';
import { compactWon, parsePct, parseWon, parseWonFull, won, wonFull } from './format';
import { averageLiving, categoryTotals, lastMonths, monthRange, monthTotals, shiftMonth, type LedgerEntry } from './ledger';
import { normalizePeople } from './people';
import { DEFAULT_PLAN } from './plan';
import { paydaysBetween, todayKst } from './schedule';
import { timeline } from './timeline';

describe('format', () => {
  it('억·만 표시', () => {
    expect(won(40641.48)).toBe('4억 641만');
    expect(won(-508.8)).toBe('−509만');
    expect(won(20000)).toBe('2억');
    expect(compactWon(19236)).toBe('1.9억');
    expect(wonFull(352000)).toBe('35만 2,000원');
  });

  it('입력 해석', () => {
    expect(parseWon('1.5억')).toBe(15000);
    expect(parseWon('1억 5,000만')).toBe(15000);
    expect(parseWon('3,200')).toBe(3200);
    expect(parseWon('abc')).toBeNull();
    expect(parseWonFull('35만2000')).toBe(352000);
    expect(parseWonFull('3.5만')).toBe(35000);
    expect(parseWonFull('52,000원')).toBe(52000);
    expect(parsePct('3.3')).toBeCloseTo(0.033);
  });
});

describe('schedule', () => {
  it('월급날 세기: 오늘·잔금일 당일은 빼고, 없는 날은 말일', () => {
    expect(paydaysBetween('2026-10-19', '2027-06-30', 25)).toBe(9);
    expect(paydaysBetween('2026-10-25', '2027-06-30', 25)).toBe(8);
    expect(paydaysBetween('2027-01-31', '2027-03-01', 31)).toBe(1);
    expect(paydaysBetween('2027-07-01', '2027-06-30', 25)).toBe(0);
  });

  it('한국 시간 오늘', () => {
    expect(todayKst(new Date('2026-10-18T15:30:00Z'))).toBe('2026-10-19');
  });
});

const entry = (day: string, kind: 'in' | 'out', category: string, amount: number): LedgerEntry =>
  ({ id: Math.random(), day, kind, category, amount, who: '', memo: '' });

describe('ledger', () => {
  const entries = [
    entry('2026-09-21', 'in', '월급', 9_000_000),
    entry('2026-09-03', 'out', '생활비', 2_800_000),
    entry('2026-09-25', 'out', '주거·관리비', 900_000),
    entry('2026-10-02', 'out', '생활비', 3_200_000),
    entry('2026-10-05', 'out', '보험', 200_000),
  ];

  it('달 계산', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2027-01', -1)).toBe('2026-12');
    expect(monthRange('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(lastMonths('2026-10', 3)).toEqual(['2026-08', '2026-09', '2026-10']);
  });

  it('달 합계와 분류별', () => {
    const [sep] = monthTotals(entries, ['2026-09']);
    expect(sep).toEqual({ month: '2026-09', income: 9_000_000, spend: 3_700_000, left: 5_300_000 });
    expect(categoryTotals(entries, '2026-10')[0]).toEqual({ category: '생활비', amount: 3_200_000 });
  });

  it('생활비 평균은 기록 있는 달만, 주거·대출은 빼고', () => {
    const r = averageLiving(entries, ['2026-08', '2026-09', '2026-10']);
    expect(r.count).toBe(2);
    expect(r.avg).toBe((2_800_000 + 3_400_000) / 2);
  });
});

describe('timeline & compute', () => {
  const model = computePlan(DEFAULT_PLAN, normalizePeople({}), {}, '2027-01-10');

  it('지난 날짜는 past, 잔금일이 key, 잔금 후는 해마다', () => {
    const items = timeline(model.s, model.c, model.o);
    expect(items.find((x) => x.what.startsWith('PI'))?.past).toBe(true);
    expect(items.find((x) => x.key)?.when).toBe('6월 30일');
    expect(items.at(-1)?.when).toBe('2030년 6월');
  });

  it('내가 넣은 일정도 날짜순으로 끼운다', () => {
    const events = [{ id: 'e1', date: '2026-12-31', text: '혼인신고' }, { id: 'e2', date: '2028-07-01', text: '이사' }];
    const items = timeline(model.s, model.c, model.o, events);
    const whats = items.map((x) => x.what);
    expect(whats.indexOf('혼인신고')).toBeLessThan(whats.findIndex((w) => w.startsWith('PS')));
    expect(items.find((x) => x.eventId === 'e2')?.when).toBe('2028년 7월 1일');
    expect(whats.indexOf('이사')).toBeGreaterThan(items.findIndex((x) => x.when === '2028년 6월'));
  });

  it('실시간 환율이 있으면 그 값을 쓴다', () => {
    const fx = { 'FX:USDKRW': { price: 1350, currency: 'KRW', asOf: '', source: '', fetchedAt: '', stale: false } };
    expect(computePlan(DEFAULT_PLAN, normalizePeople({}), fx, '2026-10-19').rates.usdkrw).toBe(1350);
    const off = { ...DEFAULT_PLAN, useLiveFx: false };
    expect(computePlan(off, normalizePeople({}), fx, '2026-10-19').rates.usdkrw).toBe(1400);
  });
});
