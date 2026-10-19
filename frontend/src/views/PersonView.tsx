// 사람 탭: 지금 쓸 수 있는 돈 | 은행, 특별성과급, 퇴직금 | 증권 계좌
import { newBroker, patchIn, patchPerson, removeFrom } from '../domain/edit';
import { won } from '../domain/format';
import type { Person, PersonKey } from '../domain/people';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { Card, PageHead } from '../ui/bits';
import { NumberInput } from '../ui/inputs';
import { BankCard } from './person/BankCard';
import { BrokerCard } from './person/BrokerCard';
import { RetireCard } from './person/RetireCard';
import { StocksHead } from './person/StocksHead';

export function PersonView({ who }: { who: PersonKey }) {
  const { model, quotes } = useModel();
  const syncs = useSyncs();
  const [people, setPeople] = useDocSync(syncs.people);
  const [plan] = useDocSync(syncs.plan);
  const person = people[who];
  const mine = model.hh[who];
  const patch = (p: Partial<Person>) => setPeople(patchPerson(people, who, p));
  const brokers = person.brokers;
  const sub = `은행 ${won(mine.bank)} + 주식 팔면 ${won(mine.stocks.afterTax)}`;
  return (
    <div className="page person">
      <PageHead title={plan.names[who]} numLabel="지금 쓸 수 있는 돈" num={won(mine.liquid)} sub={sub} />
      <div className="grid even">
        <div className="col">
          <BankCard banks={person.banks} onChange={(banks) => patch({ banks })} />
          <Card title="특별성과급 (세후)" value={won(person.opi2)}>
            <NumberInput kind="won" aria-label="특별성과급 세후 (만원)" placeholder="회사 공지 금액 (만원)" value={person.opi2} onValue={(opi2) => patch({ opi2 })} />
            <p className="hint">잔금 뒤 나눠 팔아서 금고를 갚는 데 써요.</p>
          </Card>
          <RetireCard input={person.retire} result={mine.retire} onChange={(retire) => patch({ retire })} />
        </div>
        <div className="col">
          <StocksHead stocks={mine.stocks} quotes={quotes} rates={model.rates} liveFx={model.liveFx} />
          {brokers.map((b, i) => (
            <BrokerCard key={b.id} broker={b} sale={mine.stocks.brokers[i]}
              onChange={(next) => patch({ brokers: patchIn(brokers, b.id, next) })}
              onRemove={() => patch({ brokers: removeFrom(brokers, b.id) })} />
          ))}
          <button type="button" className="btn ghost" onClick={() => patch({ brokers: [...brokers, newBroker()] })}>+ 증권 계좌 추가</button>
        </div>
      </div>
    </div>
  );
}
