// 증권사별로 지금 팔면 받는 돈. 금액은 만원, 주가는 원(국내)·달러(미국)
import { priceOf, type Market, type Priced, type QuoteBook } from './pricing';

const WON = 10000;

export interface Holding {
  id: string; market: Market; code: string; name: string;
  qty: number; avg: number; fxBuy: number; manual: number;
}
export interface Broker {
  id: string; name: string; krFee: number; usFee: number; fxFee: number; holdings: Holding[];
}
export interface SaleRates { usdkrw: number; krTax: number; usTaxRate: number; usDeduct: number }

export interface Sale { gross: number; net: number; fees: number; gain: number; us: boolean }

/** 한 종목을 팔 때: 수수료·거래세·환전 수수료를 빼고, 해외는 원화 양도차익도 구한다 */
export function holdingSale(h: Holding, price: number, broker: Broker, a: SaleRates): Sale {
  const qty = h.qty || 0;
  if (h.market === 'US') {
    const usd = qty * price;
    const feeUsd = usd * (broker.usFee || 0);
    const krw = (usd - feeUsd) * a.usdkrw;
    const net = (krw * (1 - (broker.fxFee || 0))) / WON;
    const gross = (usd * a.usdkrw) / WON;
    const cost = (qty * (h.avg || 0) * (h.fxBuy || a.usdkrw)) / WON;
    const gain = gross - (feeUsd * a.usdkrw) / WON - cost;
    return { gross, net, fees: gross - net, gain, us: true };
  }
  const gross = (qty * price) / WON;
  const fees = gross * ((broker.krFee || 0) + a.krTax);
  return { gross, net: gross - fees, fees, gain: 0, us: false };
}

/** 산 돈 (만원). 해외는 매수 환율, 모르면 지금 환율로 */
export function holdingCost(h: Holding, a: SaleRates): number {
  const qty = h.qty || 0;
  return h.market === 'US' ? (qty * (h.avg || 0) * (h.fxBuy || a.usdkrw)) / WON : (qty * (h.avg || 0)) / WON;
}

export interface PricedSale extends Sale { id: string; priced: Priced }
export interface BrokerSale { id: string; rows: PricedSale[]; gross: number; fees: number; net: number; usGain: number }
export interface PersonStocks {
  brokers: BrokerSale[]; gross: number; fees: number; net: number;
  usGain: number; usTax: number; afterTax: number;
}

const add = <T>(list: T[], pick: (x: T) => number) => list.reduce((s, x) => s + pick(x), 0);

export function brokerSale(broker: Broker, book: QuoteBook, a: SaleRates): BrokerSale {
  const rows = broker.holdings.map((h) => {
    const priced = priceOf(h, book);
    return { id: h.id, priced, ...holdingSale(h, priced.price, broker, a) };
  });
  return {
    id: broker.id, rows, gross: add(rows, (r) => r.gross), fees: add(rows, (r) => r.fees),
    net: add(rows, (r) => r.net), usGain: add(rows.filter((r) => r.us), (r) => r.gain),
  };
}

/** 한 사람의 모든 증권 계좌. 해외주식 양도세는 사람 단위로 1년 차익을 합쳐 기본공제 후 계산 */
export function personStocks(brokers: Broker[], book: QuoteBook, a: SaleRates): PersonStocks {
  const list = brokers.map((b) => brokerSale(b, book, a));
  const usGain = add(list, (b) => b.usGain);
  const usTax = Math.max(0, usGain - a.usDeduct) * a.usTaxRate;
  const net = add(list, (b) => b.net);
  return {
    brokers: list, gross: add(list, (b) => b.gross), fees: add(list, (b) => b.fees),
    net, usGain, usTax, afterTax: net - usTax,
  };
}
