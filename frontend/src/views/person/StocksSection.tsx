// 증권: 팔면 받는 돈 합계 / 구성(비중·쏠림·양도세) / 보유 종목(종목마다 펼쳐 고치기) / 계좌와 수수료
import type { PersonAssets } from '../../domain/people';
import { portfolio } from '../../domain/portfolio';
import type { Broker } from '../../domain/stocks';
import { useModel } from '../../state/ModelProvider';
import { AccountsCard } from './AccountsCard';
import { HoldingList } from './HoldingList';
import { PortfolioCard } from './PortfolioCard';
import { StocksHead } from './StocksHead';

interface Props { brokers: Broker[]; mine: PersonAssets; onChange: (brokers: Broker[]) => void }

export function StocksSection({ brokers, mine, onChange }: Props) {
  const { model, quotes } = useModel();
  return (
    <div className="col">
      <StocksHead stocks={mine.stocks} quotes={quotes} rates={model.rates} liveFx={model.liveFx} />
      <PortfolioCard p={portfolio(brokers, mine.stocks, model.rates)} />
      <HoldingList brokers={brokers} sales={mine.stocks.brokers} rates={model.rates} onChange={onChange} />
      <AccountsCard brokers={brokers} sales={mine.stocks.brokers} onChange={onChange} />
    </div>
  );
}
