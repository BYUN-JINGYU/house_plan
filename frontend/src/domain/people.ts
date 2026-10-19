// 사람별 자산(은행·주식·특별성과급·퇴직금), 달마다 월급, 두 사람 합계. 금액은 만원
import { cleanMonthPay, type MonthPay } from './pay';
import { quoteKey, type QuoteBook } from './pricing';
import { severance, type RetireInput, type Severance } from './retire';
import { personStocks, type Broker, type Holding, type PersonStocks, type SaleRates } from './stocks';

export type PersonKey = 'a' | 'b';
export const PERSON_KEYS: PersonKey[] = ['a', 'b'];

export interface Bank { id: string; name: string; amount: number }
export interface Person { banks: Bank[]; brokers: Broker[]; opi2: number; retire: RetireInput; pay: MonthPay }
export type People = Record<PersonKey, Person>;

export const emptyRetire = (): RetireInput => ({ plan: 'severance', start: '', date: '', pay: 0, quote: 0, use: false });
export const emptyPerson = (): Person => ({ banks: [], brokers: [], opi2: 0, retire: emptyRetire(), pay: {} });

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const s = (v: unknown) => (typeof v === 'string' ? v : '');
const list = (v: unknown) => (Array.isArray(v) ? v.map(obj) : []);

function holding(h: Record<string, unknown>): Holding {
  return {
    id: s(h.id) || crypto.randomUUID(), market: h.market === 'US' ? 'US' : 'KR', code: s(h.code), name: s(h.name),
    qty: n(h.qty), avg: n(h.avg), fxBuy: n(h.fxBuy), manual: n(h.manual),
  };
}

function broker(b: Record<string, unknown>): Broker {
  return {
    id: s(b.id) || crypto.randomUUID(), name: s(b.name), krFee: n(b.krFee), usFee: n(b.usFee), fxFee: n(b.fxFee),
    holdings: list(b.holdings).map(holding),
  };
}

function person(p: Record<string, unknown>): Person {
  const r = obj(p.retire);
  const plan = r.plan === 'dc' || r.plan === 'db' ? r.plan : 'severance';
  return {
    banks: list(p.banks).map((b) => ({ id: s(b.id) || crypto.randomUUID(), name: s(b.name), amount: n(b.amount) })),
    brokers: list(p.brokers).map(broker),
    opi2: n(p.opi2),
    retire: { plan, start: s(r.start), date: s(r.date), pay: n(r.pay), quote: n(r.quote), use: r.use === true },
    pay: cleanMonthPay(p.pay),
  };
}

/** 저장된 값이 일부 비어 있거나 모양이 달라도 화면이 깨지지 않게 채운다 */
export function normalizePeople(raw: unknown): People {
  const o = obj(raw);
  return { a: person(obj(o.a)), b: person(obj(o.b)) };
}

export interface PersonAssets {
  bank: number; stocks: PersonStocks; liquid: number; opi2: number;
  retire: Severance | null; retireNet: number; useRetire: boolean;
}

export function personAssets(p: Person, book: QuoteBook, a: SaleRates): PersonAssets {
  const bank = p.banks.reduce((sum, b) => sum + (b.amount || 0), 0);
  const stocks = personStocks(p.brokers, book, a);
  const retire = severance(p.retire);
  const retireNet = retire?.allowed ? Math.max(0, retire.net) : 0;
  return {
    bank, stocks, liquid: bank + stocks.afterTax, opi2: p.opi2 || 0,
    retire, retireNet, useRetire: p.retire.use && retireNet > 0,
  };
}

export interface Household {
  a: PersonAssets; b: PersonAssets; have: number; bonus: number; retireUsed: number; retireSpare: number;
}

export function household(people: People, book: QuoteBook, a: SaleRates): Household {
  const pa = personAssets(people.a, book, a);
  const pb = personAssets(people.b, book, a);
  const used = (x: PersonAssets) => (x.useRetire ? x.retireNet : 0);
  const spare = (x: PersonAssets) => (x.useRetire ? 0 : x.retireNet);
  return {
    a: pa, b: pb,
    have: pa.liquid + pb.liquid + used(pa) + used(pb),
    bonus: pa.opi2 + pb.opi2,
    retireUsed: used(pa) + used(pb),
    retireSpare: spare(pa) + spare(pb),
  };
}

/** 시세를 받아야 할 종목 키 (형식이 맞는 것만) */
export function symbolsOf(people: People): string[] {
  const keys = new Set<string>();
  for (const k of PERSON_KEYS) {
    for (const b of people[k].brokers) {
      for (const h of b.holdings) {
        const key = quoteKey(h.market, h.code);
        if (key) keys.add(key);
      }
    }
  }
  return [...keys].sort();
}
