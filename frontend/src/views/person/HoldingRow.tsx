// 종목 한 줄: 코드·이름·팔면 받는 돈 / 수량·평단·(매수 환율)·현재가
import { num, won } from '../../domain/format';
import type { Holding, PricedSale } from '../../domain/stocks';
import { NumberInput, TextInput } from '../../ui/inputs';

const SOURCE: Record<string, string> = { pykrx: 'pykrx', yahoo: 'Yahoo', ecb: 'ECB' };

interface Props { h: Holding; sale: PricedSale; onChange: (p: Partial<Holding>) => void; onRemove: () => void }

function priceNote(sale: PricedSale): string {
  const { from, quote } = sale.priced;
  if (from === 'manual') return '직접 넣은 값';
  if (from === 'live' && quote) return `${quote.asOf.slice(5).replace('-', '/')} ${SOURCE[quote.source] ?? quote.source}${quote.stale ? ', 오래됨' : ''}`;
  return '시세 없음';
}

export function HoldingRow({ h, sale, onChange, onRemove }: Props) {
  const us = h.market === 'US';
  const quote = sale.priced.quote;
  const live = quote ? (us ? `$${num(quote.price)}` : `${num(quote.price)}원`) : '';
  return (
    <li className="holding">
      <div className="h-top">
        <span className="mkt">{us ? '미국' : '국내'}</span>
        <TextInput className="code" aria-label="종목코드" placeholder={us ? 'AAPL' : '005930'} maxLength={10} value={h.code}
          onValue={(code) => onChange({ code: code.toUpperCase().replace(/\s/g, '') })} />
        <TextInput className="hname" aria-label="종목 이름" placeholder="이름 (선택)" value={h.name} onValue={(name) => onChange({ name })} />
        <strong className="hnet" title="팔면 받는 돈">{won(sale.net)}</strong>
        <button type="button" className="icon-btn" aria-label="이 종목 지우기" onClick={onRemove}>×</button>
      </div>
      <div className="h-bottom">
        <label className="mini">수량<NumberInput kind="num" value={h.qty} onValue={(qty) => onChange({ qty })} /></label>
        <label className="mini">평단 ({us ? '$' : '원'})<NumberInput kind="num" value={h.avg} onValue={(avg) => onChange({ avg })} /></label>
        {us && <label className="mini">매수 환율<NumberInput kind="num" value={h.fxBuy} placeholder="모르면 비움" onValue={(fxBuy) => onChange({ fxBuy })} /></label>}
        <label className="mini">현재가 ({us ? '$' : '원'})<NumberInput kind="num" value={h.manual} placeholder={live || '직접 입력'} onValue={(manual) => onChange({ manual })} /></label>
        <span className="src">{priceNote(sale)}</span>
      </div>
    </li>
  );
}
