// 증권: 팔면 받는 돈 합계 / 보유 종목(종목마다 펼쳐 고치기) / 계좌와 수수료
import type { PersonAssets } from '../../domain/people';
import type { Broker } from '../../domain/stocks';
import { useModel } from '../../state/ModelProvider';
import { AccountsCard } from './AccountsCard';
import { HoldingList } from './HoldingList';
import { StocksHead } from './StocksHead';

interface Props { brokers: Broker[]; mine: PersonAssets; onChange: (brokers: Broker[]) => void }

export function StocksSection({ brokers, mine, onChange }: Props) {
  const { model, quotes } = useModel();
  return (
    <div className="col">
      <StocksHead stocks={mine.stocks} quotes={quotes} rates={model.rates} liveFx={model.liveFx} />
      <HoldingList brokers={brokers} sales={mine.stocks.brokers} rates={model.rates} onChange={onChange} />
      <AccountsCard brokers={brokers} sales={mine.stocks.brokers} onChange={onChange} />
    </div>
  );
}
