// 잔금 자금표와 연도별 흐름. 예시 기본값으로 손으로 셀 수 있는 숫자만 고정한다.
import { describe, expect, it } from 'vitest';
import { DEFAULTS, withOverrides } from './assumptions';
import { closing, funding, monthlyOut } from './closing';
import { buildScenario } from './scenario';
import { bonusNeeded, outlook, periodLabel, simulate } from './yearly';

const TODAY = '2026-10-19';
const scene = (over = {}, money = { have: 0, bonus: 0 }, asOf = TODAY, paid = false) =>
  buildScenario(withOverrides(over), money, asOf, paid);

describe('closing', () => {
  const c = closing(scene());

  it('부대비용: 취득세 3.3%, 중개 0.5%+부가세, 채권 할인, 보증료 2년', () => {
    expect(c.costs.acq).toBeCloseTo(3300);
    expect(c.costs.broker).toBeCloseTo(550);
    expect(c.costs.bond).toBeCloseTo(182);
    expect(c.costs.guar).toBeCloseTo(720);
    expect(c.costSum).toBeCloseTo(6272);
  });

  it('들어올 돈: 남은 월급 9번(10/25~6/25) + PI + PS 세후', () => {
    expect(c.inflows.save).toBe(9 * (900 - 300));
    expect(c.inflows.pi).toBe(200);
    expect(c.inflows.ps).toBeCloseTo(12000 * 0.3 * 0.57);
    expect(c.inflow).toBeCloseTo(7652);
  });

  it('지금 있어야 할 돈 = 우리 몫 + 부대비용 − 들어올 돈 + 비상금', () => {
    expect(c.own).toBe(30000);
    expect(c.req).toBeCloseTo(36272 - 7652);
    const month = 300 + 25 + 150 / 12 + (40000 * 0.04) / 12 + (30000 * 0.015) / 12 + (30000 * 0.031 * 0.385) / 12;
    expect(c.buffer).toBeCloseTo(3 * month);
    expect(c.reqAll).toBeCloseTo(c.req + c.buffer);
    expect(Object.values(monthlyOut(scene())).reduce((a, b) => a + b)).toBeCloseTo(month);
  });

  it('이미 받은 돈은 빠진다 (PS 날짜가 지나면 PS 0)', () => {
    const later = closing(scene({}, { have: 0, bonus: 0 }, '2027-02-10'));
    expect(later.inflows.ps).toBe(0);
    expect(later.inflows.pi).toBe(0);
    expect(later.inflows.save).toBe(5 * 600);
  });

  it('계약금 때 쓸 수 있는 돈: 그때까지 월급 4번 + PI', () => {
    const s = scene({}, { have: 1000, bonus: 0 });
    expect(s.depMonths).toBe(4);
    expect(closing(s).depCash).toBeCloseTo(1000 + 4 * 600 + 200);
  });

  it('계약금을 냈으면 그만큼 덜 필요하다', () => {
    const paid = closing(scene({}, { have: 0, bonus: 0 }, TODAY, true));
    expect(c.req - paid.req).toBeCloseTo(DEFAULTS.price * DEFAULTS.depositRate);
  });

  it('채우는 방법을 더하면 전체와 같다', () => {
    const s = scene({}, { have: 10000, bonus: 0 });
    const f = funding(s, closing(s));
    const sum = f.parts.reduce((x, p) => x + p.v, 0) + f.short;
    expect(sum).toBeCloseTo(f.whole);
  });
});

describe('yearly', () => {
  it('기간 이름은 잔금 달 기준', () => {
    expect(periodLabel(scene(), 1)).toBe('2027.6~2028.5');
    expect(periodLabel(scene({ closingDate: '2027-01-15' }), 2)).toBe('2028.1~2028.12');
  });

  it('사내대출: 거치 동안 잔액 그대로, 상환 끝나면 0', () => {
    const rows = simulate(scene());
    expect(rows[0].coEnd).toBe(30000);
    expect(rows[0].coPay).toBeCloseTo(30000 * 0.015);
    expect(rows[12].coEnd).toBeCloseTo(0, 6);
  });

  it('금고 잔액은 줄기만 한다', () => {
    const rows = simulate(scene({}, { have: 0, bonus: 12000 }));
    rows.slice(1).forEach((r, i) => expect(r.ggEnd).toBeLessThanOrEqual(rows[i].ggEnd + 1e-9));
  });

  it('필요한 특별성과급을 넣으면 만기 때 금고가 0', () => {
    const need = bonusNeeded(scene());
    expect(need).not.toBeNull();
    const o = outlook(scene({}, { have: 0, bonus: need! }));
    expect(o.atMaturity).toBeLessThanOrEqual(0.5);
    const short = outlook(scene({}, { have: 0, bonus: need! * 0.9 }));
    expect(short.atMaturity).toBeGreaterThan(0.5);
  });
});
