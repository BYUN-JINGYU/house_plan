// 잔금 뒤 달마다 대출표: 거치·원리금, 금고 계획 상환·실제 상환·금리 변경, 이자 혜택 과세, 연도별 계획과 맞는지
import { describe, expect, it } from 'vitest';
import { withOverrides } from './assumptions';
import { EMPTY_LOANS, normalizeLoans, patchMonth, rateAt } from './loanlog';
import { loanSchedule, loanSummary } from './loans';
import { buildScenario } from './scenario';
import { outlook, type YearRow } from './yearly';

const s = buildScenario(withOverrides({
  closingDate: '2027-04-01', coLoan: 12000, coRate: 0.02, coGrace: 1, coTerm: 1,
  ggA: 5000, ggB: 5000, ggRate: 0.06, ggTerm: 2, fairRate: 0.05, marginal: 0.2,
}), { have: 0, bonus: 0 }, '2026-10-19');
const year = (tranche: number, surplus: number) => ({ tranche, surplus }) as YearRow;
const ROWS = [year(1000, 2000), year(0, 3000), year(0, 0)];

describe('사내대출', () => {
  const rows = loanSchedule(s, ROWS, EMPTY_LOANS);

  it('잔금 달부터 시작하고, 거치 동안은 이자만', () => {
    expect(rows[0].month).toBe('2027-04');
    expect(rows[0].coInt).toBeCloseTo(20);
    expect(rows[11].coPrin).toBe(0);
  });

  it('거치 뒤에는 원리금균등으로 기간 안에 다 갚는다', () => {
    const r = 0.02 / 12;
    const pmt = (12000 * r) / (1 - (1 + r) ** -12);
    expect(rows[12].coInt + rows[12].coPrin).toBeCloseTo(pmt);
    expect(rows[23].coBal).toBeCloseTo(0);
  });

  it('이자 혜택 과세 = 잔액 × (적정이자율 − 금리) × 한계세율 ÷ 12', () => {
    expect(rows[0].lowTax).toBeCloseTo((12000 * 0.03 * 0.2) / 12);
  });
});

describe('금고', () => {
  it('계획: 특별성과급은 그해 첫 달, 지난해 남는 돈은 다음 해 첫 달에 갚는다', () => {
    const rows = loanSchedule(s, ROWS, EMPTY_LOANS);
    expect(rows[0].ggRepay).toBe(1000);
    expect(rows[0].ggInt).toBeCloseTo((9000 * 0.06) / 12);
    expect(rows[12].ggRepay).toBe(2000);
    expect(rows[24]).toMatchObject({ maturity: true, ggRepay: 3000, ggBal: 4000 });
  });

  it('실제로 적은 달은 그 금액 (0이면 안 갚음)', () => {
    const log = patchMonth(EMPTY_LOANS, '2027-04', { ggRepay: 0, paid: true });
    const rows = loanSchedule(s, ROWS, log);
    expect(rows[0]).toMatchObject({ ggRepay: 0, entered: true, paid: true, ggBal: 10000 });
    expect(rows[0].ggInt).toBeCloseTo(50);
  });

  it('금리가 바뀐 달부터 새 금리', () => {
    const log = { ...EMPTY_LOANS, rates: [{ id: 'r', month: '2027-06', loan: 'gg' as const, rate: 0.08 }] };
    const rows = loanSchedule(s, ROWS, log);
    expect(rows[1].ggRate).toBe(0.06);
    expect(rows[2].ggInt).toBeCloseTo((9000 * 0.08) / 12);
  });

  it('요약: 만기에 남는 돈, 다 갚는 달, 이번 달', () => {
    const sum = loanSummary(loanSchedule(s, ROWS, EMPTY_LOANS), '2027-05-10');
    expect(sum.atMaturity).toBe(4000);
    expect(sum.now?.month).toBe('2027-05');
    expect(sum.ggPaidOff).toBeNull();
  });
});

describe('연도별 계획과 맞는지', () => {
  it('기본 가정이면 금고 만기 잔액과 해마다 금고 이자가 연도별 계획과 같다', () => {
    const base = buildScenario(withOverrides({}), { have: 0, bonus: 20000 }, '2026-10-19');
    const o = outlook(base);
    const rows = loanSchedule(base, o.rows, EMPTY_LOANS);
    expect(loanSummary(rows, '2026-10-19').atMaturity).toBeCloseTo(o.atMaturity);
    const firstYear = rows.slice(0, 12).reduce((sum, r) => sum + r.ggInt, 0);
    expect(firstYear).toBeCloseTo(o.rows[0].ggInt);
  });
});

describe('기록 문서', () => {
  it('형식이 맞는 것만 남기고, 빈 기록은 지운다', () => {
    const doc = normalizeLoans({ months: { '2027-05': { paid: true, ggRepay: 300 }, '2027-13': { paid: true }, '2027-06': { paid: 'y' } },
      rates: [{ month: '2027-07', loan: 'gg', rate: 0.05 }, { month: '2027-07', loan: 'x', rate: 0.05 }, { month: '2027-08', loan: 'co', rate: 2 }] });
    expect(doc.months).toEqual({ '2027-05': { paid: true, ggRepay: 300 } });
    expect(doc.rates).toHaveLength(1);
    expect(patchMonth(doc, '2027-05', { paid: false, ggRepay: undefined }).months).toEqual({});
  });

  it('그 달 금리는 그 달까지 바뀐 것 중 가장 늦은 것', () => {
    const rates = [{ id: 'a', month: '2027-06', loan: 'gg' as const, rate: 0.05 }, { id: 'b', month: '2028-01', loan: 'gg' as const, rate: 0.045 }];
    expect(rateAt(rates, 'gg', '2027-05', 0.04)).toBe(0.04);
    expect(rateAt(rates, 'gg', '2027-12', 0.04)).toBe(0.05);
    expect(rateAt(rates, 'gg', '2028-03', 0.04)).toBe(0.045);
    expect(rateAt(rates, 'co', '2028-03', 0.015)).toBe(0.015);
  });
});
