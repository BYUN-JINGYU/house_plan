// 주식 팔 때 받는 돈, 퇴직금 세금, 사람별 합계
import { describe, expect, it } from 'vitest';
import { household, normalizePeople, symbolsOf } from './people';
import { severance } from './retire';
import { holdingSale, personStocks, type Broker, type Holding } from './stocks';

const rates = { usdkrw: 1400, krTax: 0.002, usTaxRate: 0.22, usDeduct: 250 };
const broker = (holdings: Holding[]): Broker => ({ id: 'b', name: '증권', krFee: 0.00015, usFee: 0.0025, fxFee: 0.01, holdings });
const kr: Holding = { id: 'k', market: 'KR', code: '005930', name: '', qty: 10, avg: 50000, fxBuy: 0, manual: 0 };
const us: Holding = { id: 'u', market: 'US', code: 'AAPL', name: '', qty: 10, avg: 150, fxBuy: 1300, manual: 0 };

describe('holdingSale', () => {
  it('국내: 수수료 + 증권거래세', () => {
    const sale = holdingSale(kr, 61000, broker([]), rates);
    expect(sale.gross).toBeCloseTo(61);
    expect(sale.net).toBeCloseTo(61 * (1 - 0.00215));
  });

  it('해외: 달러 수수료 → 환전 수수료, 원화 양도차익', () => {
    const sale = holdingSale(us, 200, broker([]), rates);
    expect(sale.gross).toBeCloseTo(280);
    expect(sale.net).toBeCloseTo(276.507);
    expect(sale.gain).toBeCloseTo(280 - 0.7 - 195);
  });
});

describe('personStocks', () => {
  it('해외 양도세는 사람 단위로 250만 공제 후 22%', () => {
    const book = { 'US:AAPL': { price: 200, currency: 'USD', asOf: '', source: '', fetchedAt: '', stale: false } };
    const big = { ...us, qty: 100 };
    const r = personStocks([broker([big])], book, rates);
    expect(r.usGain).toBeCloseTo(843);
    expect(r.usTax).toBeCloseTo((843 - 250) * 0.22);
    expect(r.afterTax).toBeCloseTo(r.net - r.usTax);
  });

  it('직접 넣은 가격이 시세보다 먼저', () => {
    const book = { 'KR:005930': { price: 61000, currency: 'KRW', asOf: '', source: '', fetchedAt: '', stale: false } };
    const r = personStocks([broker([{ ...kr, manual: 70000 }])], book, rates);
    expect(r.brokers[0].rows[0].priced.from).toBe('manual');
    expect(r.gross).toBeCloseTo(70);
  });
});

describe('severance', () => {
  it('10년, 1억: 근속연수공제 1,500만 → 환산 → 세금 387.5만 + 지방세', () => {
    const r = severance({ plan: 'severance', start: '2016-01-10', date: '2026-01-01', pay: 0, quote: 10000, use: true })!;
    expect(r.years).toBe(10);
    expect(r.tax).toBeCloseTo(387.5);
    expect(r.net).toBeCloseTo(10000 - 387.5 * 1.1);
  });

  it('DB형은 중간정산이 안 된다', () => {
    const r = severance({ plan: 'db', start: '2016-01-10', date: '2026-01-01', pay: 600, quote: 0, use: true })!;
    expect(r.allowed).toBe(false);
    expect(r.estimated).toBe(true);
  });
});

describe('people', () => {
  it('망가진 값도 빈 사람으로 채운다', () => {
    const p = normalizePeople({ a: { banks: 'x', retire: { plan: 'zz' } }, b: null });
    expect(p.a.banks).toEqual([]);
    expect(p.a.retire.plan).toBe('severance');
    expect(p.b.brokers).toEqual([]);
  });

  it('합계: 은행 + 주식 세후 + (넣기로 한) 퇴직금', () => {
    const people = normalizePeople({
      a: { banks: [{ id: '1', name: '월급', amount: 3000 }], retire: { plan: 'severance', start: '2016-01-10', date: '2026-01-01', quote: 10000, use: true } },
      b: { banks: [{ id: '2', name: '적금', amount: 2000 }], opi2: 5000 },
    });
    const hh = household(people, {}, rates);
    expect(hh.have).toBeCloseTo(5000 + hh.retireUsed);
    expect(hh.retireUsed).toBeCloseTo(10000 - 387.5 * 1.1);
    expect(hh.bonus).toBe(5000);
  });

  it('시세 종목은 형식이 맞는 것만', () => {
    const people = normalizePeople({ a: { brokers: [{ holdings: [{ market: 'KR', code: '0059' }, { market: 'US', code: 'nvda' }] }] } });
    expect(symbolsOf(people)).toEqual(['US:NVDA']);
  });
});
