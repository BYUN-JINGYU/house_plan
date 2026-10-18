// 사람 탭: 지금 쓸 수 있는 돈 | 은행, 특별성과급, 퇴직금 | 증권 계좌
import { newBroker, patchIn, patchPerson, removeFrom } from '../domain/edit';
import { won } from '../domain/format';
import type { Person, PersonKey } from '../domain/people';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
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
  return (
    <div className="person">
      <div className="person-head">
        <p className="eyebrow">{plan.names[who]} · 지금 쓸 수 있는 돈</p>
        <p className="headline">{won(mine.liquid)}</p>
        <p className="sub">은행 {won(mine.bank)} + 주식 팔면 {won(mine.stocks.afterTax)}{mine.useRetire && ` · 퇴직금 ${won(mine.retireNet)} 따로 넣음`}</p>
      </div>
      <div className="split even">
        <section className="col">
          <BankCard banks={person.banks} onChange={(banks) => patch({ banks })} />
          <div className="card">
            <div className="card-head"><h2>특별성과급 세후 <small>자사주</small></h2><strong>{won(person.opi2)}</strong></div>
            <NumberInput kind="won" aria-label="특별성과급 세후 (만원)" placeholder="회사 공지 금액 (만원)" value={person.opi2} onValue={(opi2) => patch({ opi2 })} />
            <p className="hint">나눠 팔아서 잔금 후 금고를 갚는 데 써요. 잔금 계산에는 넣지 않아요.</p>
          </div>
          <RetireCard input={person.retire} result={mine.retire} onChange={(retire) => patch({ retire })} />
        </section>
        <section className="col">
          <StocksHead stocks={mine.stocks} quotes={quotes} rates={model.rates} liveFx={model.liveFx} />
          {brokers.map((b, i) => (
            <BrokerCard key={b.id} broker={b} sale={mine.stocks.brokers[i]}
              onChange={(next) => patch({ brokers: patchIn(brokers, b.id, next) })}
              onRemove={() => patch({ brokers: removeFrom(brokers, b.id) })} />
          ))}
          <button type="button" className="btn ghost" onClick={() => patch({ brokers: [...brokers, newBroker()] })}>+ 증권 계좌 추가</button>
        </section>
      </div>
    </div>
  );
}
