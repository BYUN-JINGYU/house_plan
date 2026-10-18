// 종목 현재가 고르기: 직접 넣은 값이 있으면 그 값, 없으면 받아 온 시세
export type Market = 'KR' | 'US';

export interface QuoteView {
  price: number;
  currency: string;
  asOf: string;
  source: string;
  fetchedAt: string;
  stale: boolean;
}
export type QuoteBook = Record<string, QuoteView>;

export const USDKRW = 'FX:USDKRW';

export interface Priced {
  price: number;
  from: 'manual' | 'live' | 'none';
  quote?: QuoteView;
}

/** 시장별 종목 표시 규칙 (백엔드와 같은 규칙) */
const RULES: Record<Market, RegExp> = {
  KR: /^[0-9A-Z]{6}$/,
  US: /^[A-Z][A-Z0-9.-]{0,9}$/,
};

export function quoteKey(market: Market, code: string): string | null {
  const c = code.trim().toUpperCase();
  return RULES[market].test(c) ? `${market}:${c}` : null;
}

export function priceOf(h: { market: Market; code: string; manual: number }, book: QuoteBook): Priced {
  const key = quoteKey(h.market, h.code);
  const quote = key ? book[key] : undefined;
  if (h.manual > 0) return { price: h.manual, from: 'manual', quote };
  if (quote) return { price: quote.price, from: 'live', quote };
  return { price: 0, from: 'none' };
}
