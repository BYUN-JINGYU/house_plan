// 문서를 고치는 작은 함수들 (원본은 그대로 두고 새 값을 돌려준다)
import type { AssumptionKey } from './assumptions';
import type { Bank, People, Person, PersonKey } from './people';
import type { PlanDoc } from './plan';
import type { Market } from './pricing';
import type { Broker, Holding } from './stocks';

const id = () => crypto.randomUUID();

export const newBank = (): Bank => ({ id: id(), name: '', amount: 0 });

/** 수수료 기본값은 보수적으로: 국내 0.015%, 해외 0.25%, 환전 1% (본인 계좌 값으로 바꾼다) */
export const newBroker = (): Broker => ({ id: id(), name: '', krFee: 0.00015, usFee: 0.0025, fxFee: 0.01, holdings: [] });

export const newHolding = (market: Market = 'KR'): Holding =>
  ({ id: id(), market, code: '', name: '', qty: 0, avg: 0, fxBuy: 0, manual: 0 });

export function patchPerson(people: People, key: PersonKey, patch: Partial<Person>): People {
  return { ...people, [key]: { ...people[key], ...patch } };
}

export function patchIn<T extends { id: string }>(list: T[], itemId: string, patch: Partial<T>): T[] {
  return list.map((x) => (x.id === itemId ? { ...x, ...patch } : x));
}

export const removeFrom = <T extends { id: string }>(list: T[], itemId: string): T[] => list.filter((x) => x.id !== itemId);

export function setOverride(plan: PlanDoc, key: AssumptionKey, value: number | string): PlanDoc {
  return { ...plan, overrides: { ...plan.overrides, [key]: value } };
}

export function clearOverride(plan: PlanDoc, key: AssumptionKey): PlanDoc {
  const rest = { ...plan.overrides };
  delete rest[key];
  return { ...plan, overrides: rest };
}
