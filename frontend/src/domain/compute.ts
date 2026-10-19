// 화면 전체가 쓰는 계산 한 번에: 문서(계획·사람·대출 기록) + 시세 + 오늘 → 숫자
import { withOverrides } from './assumptions';
import { beforeFlow } from './before';
import { closing } from './closing';
import { EMPTY_LOANS, type LoansDoc } from './loanlog';
import { loanSchedule, loanSummary } from './loans';
import { household, type People } from './people';
import type { PlanDoc } from './plan';
import { USDKRW, type QuoteBook } from './pricing';
import { buildScenario } from './scenario';
import type { Ymd } from './schedule';
import type { SaleRates } from './stocks';
import { outlook } from './yearly';

/** 금고 보증보험 대출 1인 최대 (판정 문구의 "늘리면" 비교용) */
export const GG_MAX_EACH = 30000;

export function computePlan(plan: PlanDoc, people: People, book: QuoteBook, asOf: Ymd, log: LoansDoc = EMPTY_LOANS) {
  const a = withOverrides(plan.overrides);
  const liveFx = plan.useLiveFx ? book[USDKRW]?.price : undefined;
  const rates: SaleRates = { usdkrw: liveFx ?? a.usdkrw, krTax: a.krTax, usTaxRate: a.usTaxRate, usDeduct: a.usDeduct };
  const hh = household(people, book, rates);
  const pay = { a: people.a.pay, b: people.b.pay };
  const s = buildScenario(a, { have: hh.have, bonus: hh.bonus }, asOf, plan.depositPaid, pay);
  const c = closing(s);
  const alt = closing({ ...s, ggA: Math.max(s.ggA, GG_MAX_EACH), ggB: Math.max(s.ggB, GG_MAX_EACH) });
  const o = outlook(s);
  const loans = loanSchedule(s, o.rows, log);
  return { a, rates, liveFx: liveFx !== undefined, hh, s, c, alt, o, flow: beforeFlow(s, c, pay), loans, loanSum: loanSummary(loans, asOf) };
}

export type PlanModel = ReturnType<typeof computePlan>;

/** 계산에 들어가는 것 전부 (위기 시험이 일부를 바꿔 다시 센다) */
export interface PlanInputs { plan: PlanDoc; people: People; book: QuoteBook; asOf: Ymd; log: LoansDoc }

export const computeFrom = (x: PlanInputs): PlanModel => computePlan(x.plan, x.people, x.book, x.asOf, x.log);
