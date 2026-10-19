// 잔금 자금표 (순수 함수). 금액은 만원, 비율은 소수
import type { Scenario } from './scenario';

const total = (o: object) => Object.values(o).reduce((x: number, y: number) => x + y, 0);

export interface Costs {
  acq: number; broker: number; lawyer: number; bond: number; stamp: number;
  lien: number; ggStamp: number; guar: number; move: number; repair: number;
}
export interface Inflows { save: number; pi: number; ps: number; holiday: number }
export interface Closing {
  gg: number; own: number; costs: Costs; costSum: number; need: number; paid: number;
  inflows: Inflows; inflow: number; req: number; buffer: number; reqAll: number;
  have: number; gap: number; deposit: number; depCash: number; depGap: number;
}

export const ggTotal = (s: Scenario) => s.ggA + s.ggB;

/** 잔금 직후 한 달에 나가는 돈 (성과급 제외) */
export function monthlyOut(s: Scenario) {
  const gg = ggTotal(s);
  return {
    living: s.living, upkeep: s.upkeep, propTax: s.propTax / 12,
    ggInt: (gg * s.ggRate) / 12, coInt: (s.coLoan * s.coRate) / 12,
    lowTax: (s.coLoan * (s.fairRate - s.coRate) * s.marginal) / 12,
  };
}

export function closing(s: Scenario): Closing {
  const gg = ggTotal(s);
  const costs: Costs = {
    acq: s.price * s.acqRate, broker: s.price * s.brokerRate * (1 + s.vat), lawyer: s.lawyer,
    bond: s.official * s.bondRate * s.bondDisc, stamp: s.stamp, lien: s.coLien,
    ggStamp: s.ggStamp, guar: gg * s.guarRate * s.ggTerm, move: s.move, repair: s.repair,
  };
  const inflows: Inflows = {
    save: s.payLeft - s.monthsLeft * s.living,
    pi: s.piDue ? s.pi : 0,
    ps: s.psDue ? (s.salA + s.salB) * s.ps2027 * s.netRatio : 0,
    holiday: s.holidayDue ? s.holiday * s.netRatio : 0,
  };
  const own = s.price - s.coLoan - gg;
  const costSum = total(costs);
  const need = own + costSum;
  const deposit = s.price * s.depositRate;
  const paid = s.depositPaid ? deposit : 0;
  const inflow = total(inflows);
  const req = need - paid - inflow;
  const buffer = s.bufferM * total(monthlyOut(s));
  const depCash = s.have + s.depPay - s.depMonths * s.living + (s.depPiDue ? s.pi : 0);
  return {
    gg, own, costs, costSum, need, paid, inflows, inflow, req, buffer, reqAll: req + buffer,
    have: s.have, gap: s.have - req - buffer, deposit, depCash, depGap: depCash - deposit,
  };
}

export interface FundPart { key: 'co' | 'gg' | 'save' | 'have'; label: string; v: number }

/** 잔금에 필요한 전체 돈(집값 + 부대비용 + 비상금)을 무엇으로 채우는지 */
export function funding(s: Scenario, c: Closing) {
  const whole = s.price + c.costSum + c.buffer;
  const fixed = s.coLoan + c.gg + c.paid + Math.max(0, c.inflow);
  const fromAssets = Math.min(Math.max(0, c.have), Math.max(0, whole - fixed));
  const parts: FundPart[] = [
    { key: 'co', label: '사내대출', v: s.coLoan },
    { key: 'gg', label: '금고', v: c.gg },
    { key: 'save', label: '잔금 전까지 모을 돈', v: Math.max(0, c.inflow) },
    { key: 'have', label: c.paid > 0 ? '지금 자산 + 낸 계약금' : '지금 자산', v: fromAssets + c.paid },
  ];
  return { whole, parts, short: Math.max(0, whole - fixed - fromAssets) };
}

/** 사내대출 실효금리: 이자 혜택(적정이자율과 차이)에 붙는 세금까지 넣은 금리 */
export const effectiveCoRate = (s: Scenario) => s.coRate + (s.fairRate - s.coRate) * s.marginal;
