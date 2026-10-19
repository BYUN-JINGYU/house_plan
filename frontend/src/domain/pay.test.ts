// 달마다 월급: 적은 달은 그 값, 안 적은 달은 가정의 월 실수령을 연봉 비율로 나눈 값
import { describe, expect, it } from 'vitest';
import { withOverrides } from './assumptions';
import { closing } from './closing';
import { computePlan } from './compute';
import { cleanMonthPay, householdPay, payShares, personPay, personPayRows, withMonthPay } from './pay';
import { normalizePeople } from './people';
import { DEFAULT_PLAN } from './plan';
import { buildScenario } from './scenario';
import { paydayDates } from './schedule';

const DATES = paydayDates('2026-10-19', '2027-01-31', 25);
const SHARES = { a: 0.6, b: 0.4 };

describe('월급날과 나누기', () => {
  it('오늘 뒤부터 잔금 전까지의 월급날', () => {
    expect(DATES).toEqual(['2026-10-25', '2026-11-25', '2026-12-25', '2027-01-25']);
  });

  it('연봉 비율로 나누고, 연봉이 없으면 반반', () => {
    expect(payShares(6000, 4000)).toEqual({ a: 0.6, b: 0.4 });
    expect(payShares(0, 0)).toEqual({ a: 0.5, b: 0.5 });
  });
});

describe('두 사람 월급 합계', () => {
  it('아무것도 안 적으면 월 실수령 그대로', () => {
    expect(householdPay(DATES, { a: {}, b: {} }, 900, SHARES)).toBe(3600);
  });

  it('한 사람만 적은 달은 그 사람 몫만 바뀐다', () => {
    const pay = { a: { '2026-11': 700 }, b: {} };
    expect(householdPay(DATES, pay, 900, SHARES)).toBeCloseTo(900 * 3 + 700 + 900 * 0.4);
  });

  it('둘 다 적은 달은 적은 값의 합', () => {
    const pay = { a: { '2026-12': 500 }, b: { '2026-12': 450 } };
    expect(householdPay(DATES, pay, 900, SHARES)).toBeCloseTo(900 * 3 + 950);
  });
});

describe('사람별 줄과 고치기', () => {
  it('줄마다 월급날, 적은 값, 계산에 쓰는 값', () => {
    const rows = personPayRows(DATES, { '2026-11': 700 }, 540);
    expect(rows.map((r) => r.month)).toEqual(['2026-10', '2026-11', '2026-12', '2027-01']);
    expect(rows[0]).toEqual({ month: '2026-10', date: '2026-10-25', entered: undefined, amount: 540 });
    expect(rows[1]).toEqual({ month: '2026-11', date: '2026-11-25', entered: 700, amount: 700 });
  });

  it('한 사람 묶음: 기본값은 내 연봉 몫, 합계는 줄의 합', () => {
    const s = { asOf: '2026-10-19', closingDate: '2027-01-31', payday: 25, netMonth: 900, salA: 6000, salB: 4000 };
    const mine = personPay(s, 'b', { '2026-12': 500 });
    expect(mine.fallback).toBeCloseTo(360);
    expect(mine.rows).toHaveLength(4);
    expect(mine.total).toBeCloseTo(360 * 3 + 500);
  });

  it('0이나 빈칸이면 지워서 기본값으로 돌아간다', () => {
    expect(withMonthPay({}, '2026-11', 650)).toEqual({ '2026-11': 650 });
    expect(withMonthPay({ '2026-11': 650 }, '2026-11', 0)).toEqual({});
  });

  it('저장된 값은 달 형식과 양수만 남긴다', () => {
    expect(cleanMonthPay({ '2026-11': 650, '2026-13': 1, bad: 2, '2026-12': -5, '2027-01': 'x' })).toEqual({ '2026-11': 650 });
    expect(cleanMonthPay(null)).toEqual({});
  });
});

describe('잔금 계산에 반영', () => {
  it('사람 문서에 저장된 월급이 전체 계산까지 이어진다', () => {
    const plain = computePlan(DEFAULT_PLAN, normalizePeople({}), {}, '2026-10-19');
    const paid = computePlan(DEFAULT_PLAN, normalizePeople({ a: { pay: { '2026-11': 1000, junk: 5 } } }), {}, '2026-10-19');
    expect(paid.s.payLeft - plain.s.payLeft).toBeCloseTo(1000 - 900 * 0.5);
  });

  const a = withOverrides({ netMonth: 900, living: 300, salA: 6000, salB: 4000, closingDate: '2027-01-31', depositDate: '2026-12-01' });

  it('적은 달은 모을 돈과 계약금 낼 때 현금에 들어간다', () => {
    const base = closing(buildScenario(a, { have: 0, bonus: 0 }, '2026-10-19'));
    const pay = { a: { '2026-11': 1000 }, b: {} };
    const more = closing(buildScenario(a, { have: 0, bonus: 0 }, '2026-10-19', false, pay));
    expect(base.inflows.save).toBe(4 * (900 - 300));
    expect(more.inflows.save - base.inflows.save).toBeCloseTo(1000 - 540);
    expect(more.depCash - base.depCash).toBeCloseTo(1000 - 540);
  });
});
