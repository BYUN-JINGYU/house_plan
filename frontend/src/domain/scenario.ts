// 계산에 넣을 한 장면: 가정 + 지금 자산 + 오늘 날짜.
// 오늘 이후에 들어올 돈만 남긴다 (이미 받은 PI·PS는 통장 잔액에 들어 있으므로).
import type { Assumptions } from './assumptions';
import { paydaysBetween, parseYmd, type Ymd } from './schedule';

export interface Money {
  have: number;
  bonus: number;
}

export interface Scenario extends Assumptions {
  asOf: Ymd;
  have: number;
  bonus: number;
  monthsLeft: number;
  piDue: boolean;
  psDue: boolean;
  holidayDue: boolean;
  depMonths: number;
  depPiDue: boolean;
  depositPaid: boolean;
  closeYear: number;
  closeMonth: number;
}

const ahead = (asOf: Ymd, day: Ymd, end: Ymd) => asOf < day && day < end;

export function buildScenario(a: Assumptions, money: Money, asOf: Ymd, depositPaid = false): Scenario {
  const { y, m } = parseYmd(a.closingDate);
  return {
    ...a,
    asOf,
    have: money.have,
    bonus: money.bonus,
    monthsLeft: paydaysBetween(asOf, a.closingDate, a.payday),
    piDue: ahead(asOf, a.piDate, a.closingDate),
    psDue: ahead(asOf, a.psDate, a.closingDate),
    holidayDue: ahead(asOf, a.holidayDate, a.closingDate),
    depMonths: paydaysBetween(asOf, a.depositDate, a.payday),
    depPiDue: ahead(asOf, a.piDate, a.depositDate),
    depositPaid,
    closeYear: y,
    closeMonth: m,
  };
}
