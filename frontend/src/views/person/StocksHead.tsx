// 증권 합계와 시세·환율 상태, 새로고침
import { num, pct, won } from '../../domain/format';
import { USDKRW } from '../../domain/pricing';
import type { PersonStocks, SaleRates } from '../../domain/stocks';
import type { QuotesState } from '../../state/useQuotes';

interface Props { stocks: PersonStocks; quotes: QuotesState; rates: SaleRates; liveFx: boolean }

export function StocksHead({ stocks, quotes, rates, liveFx }: Props) {
  const fx = quotes.book[USDKRW];
  const fxText = liveFx && fx ? `${fx.asOf.slice(5).replace('-', '/')} ${fx.source === 'ecb' ? 'ECB' : 'Yahoo'}` : '가정 값';
  return (
    <div className="stocks-head">
      <div className="card-head">
        <h2>증권 계좌 <small>팔면 받는 돈, 세후</small></h2>
        <strong>{won(stocks.afterTax)}</strong>
      </div>
      <p className="sum-line">
        평가액 {won(stocks.gross)} · 수수료·세금 {won(stocks.fees)}
        {stocks.usTax > 0 && ` · 해외 양도세 ${won(stocks.usTax)}`}
      </p>
      {stocks.usGain !== 0 && (
        <div className="notes">
          <p className="note">해외 차익 {won(stocks.usGain)} → {won(rates.usDeduct)} 공제 후 {pct(rates.usTaxRate)}</p>
          <p className="note">양도세는 다음 해 5월에 신고·납부해요.</p>
        </div>
      )}
      <p className="note quote-line">
        환율 {num(rates.usdkrw)}원 ({fxText})
        <button type="button" className="linkish" onClick={quotes.refresh} disabled={quotes.status === 'loading'}>
          {quotes.status === 'loading' ? '받는 중…' : '시세 새로고침'}
        </button>
      </p>
      {quotes.status === 'error' && <p className="note bad">시세를 못 받았어요: {quotes.message}. 현재가를 직접 넣어도 돼요.</p>}
      {quotes.missing.length > 0 && <p className="note">못 받은 종목: {quotes.missing.join(', ')} (현재가를 직접 넣어 주세요)</p>}
    </div>
  );
}
