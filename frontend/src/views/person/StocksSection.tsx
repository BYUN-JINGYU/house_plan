// 증권: 팔면 받는 돈 요약, 계좌별 종목, 계좌 추가
import { newBroker, patchIn, removeFrom } from '../../domain/edit';
import type { PersonAssets } from '../../domain/people';
import type { Broker } from '../../domain/stocks';
import { useModel } from '../../state/ModelProvider';
import { BrokerCard } from './BrokerCard';
import { StocksHead } from './StocksHead';

interface Props { brokers: Broker[]; mine: PersonAssets; onChange: (brokers: Broker[]) => void }

export function StocksSection({ brokers, mine, onChange }: Props) {
  const { model, quotes } = useModel();
  return (
    <div className="col">
      <StocksHead stocks={mine.stocks} quotes={quotes} rates={model.rates} liveFx={model.liveFx} />
      {brokers.map((b, i) => (
        <BrokerCard key={b.id} broker={b} sale={mine.stocks.brokers[i]}
          onChange={(next) => onChange(patchIn(brokers, b.id, next))}
          onRemove={() => onChange(removeFrom(brokers, b.id))} />
      ))}
      <button type="button" className="btn ghost" onClick={() => onChange([...brokers, newBroker()])}>+ 증권 계좌 추가</button>
    </div>
  );
}
