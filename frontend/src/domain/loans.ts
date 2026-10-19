// 잔금 뒤 달마다 대출 (잔금 달부터). 사내대출은 거치 뒤 원리금균등, 금고는 이자만 내다가 갚는다.
// 금고 계획 상환은 연도별 계획을 따른다: 그해 특별성과급 매도분과 지난해 남는 돈을 그해 첫 달에 갚는다.
// 실제로 적은 달은 그 금액을 쓰고, 금리가 바뀐 달부터는 새 금리로 센다. 상환은 그 달 이자보다 먼저 한다.
import { ggTotal } from './closing';
import { rateAt, type LoansDoc } from './loanlog';
import type { Month } from './pay';
import type { Scenario } from './scenario';
import type { YearRow } from './yearly';

export interface LoanRow {
  i: number; month: Month;
  coRate: number; coInt: number; coPrin: number; coBal: number;
  ggRate: number; ggPlan: number; ggRepay: number; entered: boolean; ggInt: number; ggBal: number;
  maturity: boolean; lowTax: number;
  /** 그 달 대출로 나가는 돈 (이자 + 사내대출 원금 + 이자 혜택 세금, 금고 상환 제외) */
  due: number;
  paid: boolean;
}

const MAX_MONTHS = 360;

export function monthAfter(y: number, m: number, k: number): Month {
  const t = y * 12 + (m - 1) + k;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

function companyPart(balance: number, rate: number, i: number, grace: number, total: number) {
  const interest = (balance * rate) / 12;
  if (i < grace || balance <= 0) return { interest, principal: 0 };
  const n = Math.max(1, total - i);
  const r = rate / 12;
  const pmt = r ? (balance * r) / (1 - (1 + r) ** -n) : balance / n;
  return { interest, principal: Math.min(balance, pmt - interest) };
}

function plannedRepay(rows: YearRow[], i: number): number {
  if (i % 12 !== 0) return 0;
  const t = i / 12;
  return (rows[t]?.tranche ?? 0) + (t > 0 ? Math.max(rows[t - 1]?.surplus ?? 0, 0) : 0);
}

export function loanSchedule(s: Scenario, plan: YearRow[], log: LoansDoc): LoanRow[] {
  const grace = Math.round(s.coGrace * 12);
  const total = grace + Math.round(s.coTerm * 12);
  const due = Math.round(s.ggTerm * 12);
  let co = s.coLoan;
  let gg = ggTotal(s);
  const rows: LoanRow[] = [];
  for (let i = 0; i < MAX_MONTHS && (i < total || gg > 0.5); i += 1) {
    const month = monthAfter(s.closeYear, s.closeMonth, i);
    const coRate = rateAt(log.rates, 'co', month, s.coRate);
    const ggRate = rateAt(log.rates, 'gg', month, s.ggRate);
    const lowTax = (co * Math.max(0, s.fairRate - coRate) * s.marginal) / 12;
    const company = companyPart(co, coRate, i, grace, total);
    const ggPlan = plannedRepay(plan, i);
    const entered = log.months[month]?.ggRepay;
    const ggRepay = Math.min(gg, entered ?? ggPlan);
    gg -= ggRepay;
    const ggInt = (gg * ggRate) / 12;
    co -= company.principal;
    rows.push({
      i, month, coRate, coInt: company.interest, coPrin: company.principal, coBal: co,
      ggRate, ggPlan, ggRepay, entered: entered !== undefined, ggInt, ggBal: gg,
      maturity: i === due, lowTax, due: company.interest + company.principal + ggInt + lowTax,
      paid: log.months[month]?.paid === true,
    });
  }
  return rows;
}

export interface LoanSummary {
  /** 오늘이 든 달 (잔금 전이면 없음) */
  now: LoanRow | undefined;
  first: LoanRow | undefined;
  atMaturity: number;
  ggPaidOff: Month | null;
  interestYear1: number;
}

export function loanSummary(rows: LoanRow[], today: string): LoanSummary {
  const month = today.slice(0, 7);
  const end = rows.find((r) => r.maturity);
  const off = rows.find((r) => r.ggBal <= 0.5);
  const year1 = rows.slice(0, 12).reduce((sum, r) => sum + r.coInt + r.ggInt, 0);
  return { now: rows.find((r) => r.month === month), first: rows[0], atMaturity: end ? end.ggBal : 0, ggPaidOff: off ? off.month : null, interestYear1: year1 };
}
