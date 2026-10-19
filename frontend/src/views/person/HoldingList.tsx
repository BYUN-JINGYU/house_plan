// 보유 종목: 계좌 구분 없이 종목마다 한 줄. 누르면 그 종목만 펼쳐 고친다. 계좌가 없으면 하나 만들어 넣는다.
import { useState } from 'react';
import { newBroker, newHolding, patchIn, removeFrom } from '../../domain/edit';
import type { Market } from '../../domain/pricing';
import { holdingCost, type Broker, type BrokerSale, type Holding, type SaleRates } from '../../domain/stocks';
import { Card } from '../../ui/bits';
import { HoldingItem } from './HoldingItem';

interface Props { brokers: Broker[]; sales: BrokerSale[]; rates: SaleRates; onChange: (brokers: Broker[]) => void }

export function HoldingList({ brokers, sales, rates, onChange }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [target, setTarget] = useState('');
  const items = brokers.flatMap((b, bi) => b.holdings.map((h, hi) => ({ b, h, sale: sales[bi]?.rows[hi] })));
  const inBroker = (id: string, fn: (hs: Holding[]) => Holding[]) =>
    onChange(brokers.map((b) => (b.id === id ? { ...b, holdings: fn(b.holdings) } : b)));
  const add = (market: Market) => {
    const h = newHolding(market);
    if (!brokers.length) onChange([{ ...newBroker(), name: '증권 계좌', holdings: [h] }]);
    else inBroker(brokers.some((b) => b.id === target) ? target : brokers[0].id, (hs) => [...hs, h]);
    setOpen(h.id);
  };
  return (
    <Card title="보유 종목" value={items.length ? `${items.length}개` : undefined}>
      {items.length ? (
        <ul className="list holdings">
          {items.map(({ b, h, sale }) => sale && (
            <HoldingItem key={h.id} h={h} sale={sale} cost={holdingCost(h, rates)} account={brokers.length > 1 ? b.name || '이름 없는 계좌' : ''}
              open={open === h.id} onToggle={() => setOpen(open === h.id ? null : h.id)}
              onChange={(p) => inBroker(b.id, (hs) => patchIn(hs, h.id, p))}
              onRemove={() => inBroker(b.id, (hs) => removeFrom(hs, h.id))} />
          ))}
        </ul>
      ) : <p className="hint">종목을 더하면 시세로 평가액과 팔면 받는 돈을 계산해요.</p>}
      <div className="card-foot">
        {brokers.length > 1 && (
          <select aria-label="종목을 더할 계좌" value={target || brokers[0].id} onChange={(e) => setTarget(e.target.value)}>
            {brokers.map((b) => <option key={b.id} value={b.id}>{b.name || '이름 없는 계좌'}</option>)}
          </select>
        )}
        <button type="button" className="linkish" onClick={() => add('KR')}>+ 국내 종목</button>
        <button type="button" className="linkish" onClick={() => add('US')}>+ 미국 종목</button>
      </div>
    </Card>
  );
}
