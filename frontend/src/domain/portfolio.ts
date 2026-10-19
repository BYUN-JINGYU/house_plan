// 한 사람의 증권 구성: 종목별 비중(평가액), 미국 비중, 가장 큰 종목,
// 해외주식 양도세를 올해 한 번에 팔 때와 두 해에 반씩 나눠 팔 때 (기본공제를 해마다 받는다).
import type { Market } from './pricing';
import type { Broker, PersonStocks, SaleRates } from './stocks';

export interface Slice { id: string; label: string; market: Market; value: number; share: number }
export interface Portfolio { total: number; slices: Slice[]; usShare: number; top: Slice | null; taxAll: number; taxSplit: number; saving: number }

const tax = (gain: number, a: SaleRates) => Math.max(0, gain - a.usDeduct) * a.usTaxRate;

export function portfolio(brokers: Broker[], stocks: PersonStocks, a: SaleRates): Portfolio {
  const raw = brokers.flatMap((b, bi) => b.holdings.map((h, hi) => ({
    id: h.id, label: h.name || h.code || '이름 없음', market: h.market, value: stocks.brokers[bi]?.rows[hi]?.gross ?? 0,
  })));
  const total = raw.reduce((s, x) => s + x.value, 0);
  const slices = raw.filter((x) => x.value > 0).sort((x, y) => y.value - x.value).map((x) => ({ ...x, share: total > 0 ? x.value / total : 0 }));
  const us = slices.filter((x) => x.market === 'US').reduce((s, x) => s + x.value, 0);
  const taxAll = tax(stocks.usGain, a);
  const taxSplit = 2 * tax(stocks.usGain / 2, a);
  return { total, slices, usShare: total > 0 ? us / total : 0, top: slices[0] ?? null, taxAll, taxSplit, saving: taxAll - taxSplit };
}
