// 증권 계좌 하나: 이름, 수수료 3가지, 종목들, 팔면 받는 돈
import { newHolding, patchIn, removeFrom } from '../../domain/edit';
import { won } from '../../domain/format';
import type { Broker, BrokerSale } from '../../domain/stocks';
import { ConfirmButton } from '../../ui/ConfirmButton';
import { NumberInput, TextInput } from '../../ui/inputs';
import { HoldingRow } from './HoldingRow';

interface Props { broker: Broker; sale: BrokerSale; onChange: (b: Broker) => void; onRemove: () => void }

export function BrokerCard({ broker, sale, onChange, onRemove }: Props) {
  const set = (patch: Partial<Broker>) => onChange({ ...broker, ...patch });
  const holdings = broker.holdings;
  return (
    <section className="card broker">
      <div className="card-head">
        <TextInput className="title-input" aria-label="증권사 이름" placeholder="증권사 이름" value={broker.name} onValue={(name) => set({ name })} />
        <strong className="card-value" title="팔면 받는 돈">{won(sale.net)}</strong>
      </div>
      <div className="fees">
        <label className="mini">국내 수수료<NumberInput kind="pct" value={broker.krFee} onValue={(krFee) => set({ krFee })} /></label>
        <label className="mini">해외 수수료<NumberInput kind="pct" value={broker.usFee} onValue={(usFee) => set({ usFee })} /></label>
        <label className="mini">환전 수수료<NumberInput kind="pct" value={broker.fxFee} onValue={(fxFee) => set({ fxFee })} /></label>
      </div>
      <ul className="list holdings">
        {holdings.map((h, i) => (
          <HoldingRow key={h.id} h={h} sale={sale.rows[i]}
            onChange={(p) => set({ holdings: patchIn(holdings, h.id, p) })}
            onRemove={() => set({ holdings: removeFrom(holdings, h.id) })} />
        ))}
      </ul>
      {holdings.length > 0 && <p className="sum-line">평가액 {won(sale.gross)}, 수수료·세금 {won(sale.fees)}</p>}
      <div className="card-foot">
        <button type="button" className="linkish" onClick={() => set({ holdings: [...holdings, newHolding('KR')] })}>+ 국내 종목</button>
        <button type="button" className="linkish" onClick={() => set({ holdings: [...holdings, newHolding('US')] })}>+ 미국 종목</button>
        <ConfirmButton className="linkish danger" label="계좌 지우기" confirm="한 번 더 누르면 지워요" onConfirm={onRemove} />
      </div>
    </section>
  );
}
