// 계산에 넣을 한 장면: 가정 + 지금 자산 + 달마다 적은 월급 + 오늘 날짜.
// 오늘 이후에 들어올 돈만 남긴다 (이미 받은 월급·PI·PS는 통장 잔액에 들어 있으므로).
import type { Assumptions } from './assumptions';
import { householdPay, NO_PAY, payShares, type PayEntries } from './pay';
import { paydayDates, parseYmd, type Ymd } from './schedule';

export interface Money {
  have: number;
  bonus: number;
}

export interface Scenario extends Assumptions {
  asOf: Ymd;
  have: number;
  bonus: number;
  monthsLeft: number;
  /** 잔금 전까지 받을 월급 (둘 합계, 실수령) */
  payLeft: number;
  piDue: boolean;
  psDue: boolean;
  holidayDue: boolean;
  depMonths: number;
  /** 계약금 내기 전까지 받을 월급 (둘 합계, 실수령) */
  depPay: number;
  depPiDue: boolean;
  depositPaid: boolean;
  closeYear: number;
  closeMonth: number;
}

const ahead = (asOf: Ymd, day: Ymd, end: Ymd) => asOf < day && day < end;

export function buildScenario(a: Assumptions, money: Money, asOf: Ymd, depositPaid = false, pay: PayEntries = NO_PAY): Scenario {
  const { y, m } = parseYmd(a.closingDate);
  const left = paydayDates(asOf, a.closingDate, a.payday);
  const dep = paydayDates(asOf, a.depositDate, a.payday);
  const shares = payShares(a.salA, a.salB);
  return {
    ...a,
    asOf,
    have: money.have,
    bonus: money.bonus,
    monthsLeft: left.length,
    payLeft: householdPay(left, pay, a.netMonth, shares),
    piDue: ahead(asOf, a.piDate, a.closingDate),
    psDue: ahead(asOf, a.psDate, a.closingDate),
    holidayDue: ahead(asOf, a.holidayDate, a.closingDate),
    depMonths: dep.length,
    depPay: householdPay(dep, pay, a.netMonth, shares),
    depPiDue: ahead(asOf, a.piDate, a.depositDate),
    depositPaid,
    closeYear: y,
    closeMonth: m,
  };
}
