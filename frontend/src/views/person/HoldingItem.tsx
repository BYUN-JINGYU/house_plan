// 보유 종목 한 줄: 접으면 이름·평가액·수익률, 펼치면 그 종목만 고친다 (수량·평단·매수 환율·현재가)
import { num, pct, won } from '../../domain/format';
import type { Holding, PricedSale } from '../../domain/stocks';
import { Rows } from '../../ui/bits';
import { ConfirmButton } from '../../ui/ConfirmButton';
import { NumberInput, TextInput } from '../../ui/inputs';
import { Num } from '../../ui/Num';

const SOURCE: Record<string, string> = { pykrx: 'pykrx', yahoo: 'Yahoo', ecb: 'ECB' };

interface Props {
  h: Holding; sale: PricedSale; cost: number; account: string;
  open: boolean; onToggle: () => void; onChange: (p: Partial<Holding>) => void; onRemove: () => void;
}

function priceNote(sale: PricedSale): string {
  const { from, quote } = sale.priced;
  if (from === 'manual') return '현재가는 직접 넣은 값이에요.';
  if (from === 'live' && quote) return `${quote.asOf.slice(5).replace('-', '/')} ${SOURCE[quote.source] ?? quote.source} 시세예요${quote.stale ? ' (오래됨)' : ''}.`;
  return '시세가 없어요. 현재가를 직접 넣어요.';
}

const signed = (r: number) => `${r >= 0 ? '+' : '−'}${pct(Math.abs(r), 1)}`;

export function HoldingItem({ h, sale, cost, account, open, onToggle, onChange, onRemove }: Props) {
  const us = h.market === 'US';
  const gain = sale.gross - cost;
  const quote = sale.priced.quote;
  const unit = us ? '$' : '원';
  return (
    <li className={`holding${open ? ' open' : ''}`}>
      <button type="button" className="h-row" aria-expanded={open} onClick={onToggle}>
        <span className="mkt">{us ? '미국' : '국내'}</span>
        <span className="h-name">
          <strong>{h.name || h.code || '새 종목'}</strong>
          <small>{h.name && h.code ? `${h.code} ` : ''}{account}</small>
        </span>
        <span className="h-val">
          <strong><Num text={won(sale.gross)} /></strong>
          {cost > 0 && <small className={gain >= 0 ? 'good' : 'bad'}>{signed(gain / cost)}</small>}
        </span>
      </button>
      {open && (
        <div className="h-edit">
          <div className="pair">
            <label className="fld">종목코드
              <TextInput className="code" placeholder={us ? 'AAPL' : '005930'} maxLength={10} value={h.code}
                onValue={(code) => onChange({ code: code.toUpperCase().replace(/\s/g, '') })} /></label>
            <label className="fld">이름<TextInput placeholder="선택" value={h.name} onValue={(name) => onChange({ name })} /></label>
          </div>
          <div className="h-nums">
            <label className="mini">수량<NumberInput kind="num" value={h.qty} onValue={(qty) => onChange({ qty })} /></label>
            <label className="mini">평단 ({unit})<NumberInput kind="num" value={h.avg} onValue={(avg) => onChange({ avg })} /></label>
            {us && <label className="mini">매수 환율<NumberInput kind="num" value={h.fxBuy} placeholder="모르면 비움" onValue={(fxBuy) => onChange({ fxBuy })} /></label>}
            <label className="mini">현재가 ({unit})<NumberInput kind="num" value={h.manual}
              placeholder={quote ? num(quote.price) : '직접 입력'} onValue={(manual) => onChange({ manual })} /></label>
          </div>
          <p className="note">{priceNote(sale)}</p>
          <Rows rows={[
            { label: '평가액', value: won(sale.gross) },
            { label: '산 돈', value: cost > 0 ? won(cost) : '평단 입력 전' },
            { label: '수수료·거래세', value: won(-sale.fees) },
            { label: '팔면 받는 돈', note: us ? '해외 양도세는 사람 단위로 따로 빼요' : undefined, value: won(sale.net), cls: 'total' },
          ]} />
          <div className="card-foot">
            <ConfirmButton className="linkish danger" label="이 종목 지우기" confirm="한 번 더 누르면 지워요" onConfirm={onRemove} />
          </div>
        </div>
      )}
    </li>
  );
}
