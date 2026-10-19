// 증권 합계와 시세·환율 상태, 새로고침
import { num, pct, won } from '../../domain/format';
import { USDKRW } from '../../domain/pricing';
import type { PersonStocks, SaleRates } from '../../domain/stocks';
import type { QuotesState } from '../../state/useQuotes';
import { Card, More } from '../../ui/bits';

interface Props { stocks: PersonStocks; quotes: QuotesState; rates: SaleRates; liveFx: boolean }

export function StocksHead({ stocks, quotes, rates, liveFx }: Props) {
  const fx = quotes.book[USDKRW];
  const fxFrom = liveFx && fx ? `${fx.asOf.slice(5).replace('-', '/')} ${fx.source === 'ecb' ? 'ECB' : 'Yahoo'}` : '가정 값';
  return (
    <Card title={<>증권 계좌 <small>팔면 받는 돈, 세후</small></>} value={won(stocks.afterTax)} className="stocks-head">
      <p className="sum-line">평가액 {won(stocks.gross)}에서 수수료·세금 {won(stocks.fees + stocks.usTax)}을 빼요.</p>
      <p className="note quote-line">
        <span>환율 {num(rates.usdkrw)}원 ({fxFrom})</span>
        <button type="button" className="linkish" onClick={quotes.refresh} disabled={quotes.status === 'loading'}>
          {quotes.status === 'loading' ? '시세 받는 중…' : '시세 새로고침'}
        </button>
      </p>
      {quotes.status === 'error' && <p className="note bad">시세를 못 받았어요. 현재가를 직접 넣어도 돼요.</p>}
      {quotes.missing.length > 0 && <p className="note">못 받은 종목: {quotes.missing.join(', ')}</p>}
      {stocks.usGain !== 0 && (
        <More label="해외주식 양도세">
          <p>올해 차익 {won(stocks.usGain)}에서 {won(rates.usDeduct)}을 빼고 {pct(rates.usTaxRate)}: {won(stocks.usTax)}</p>
          <p>다음 해 5월에 신고하고 내요.</p>
        </More>
      )}
    </Card>
  );
}
