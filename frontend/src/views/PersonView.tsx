// 사람 탭: 지금 쓸 수 있는 돈 + 항목(은행·성과급·월급·증권·퇴직금)을 작은 탭으로 하나씩
import { useState, type ReactNode } from 'react';
import { patchPerson } from '../domain/edit';
import { won } from '../domain/format';
import { personPay, withMonthPay } from '../domain/pay';
import type { Person, PersonKey } from '../domain/people';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { PageHead } from '../ui/bits';
import { Tabs } from '../ui/Tabs';
import { BankCard } from './person/BankCard';
import { BonusCard } from './person/BonusCard';
import { PayCard } from './person/PayCard';
import { RetireCard } from './person/RetireCard';
import { lastSection, rememberSection, SECTIONS, type Section } from './person/sections';
import { StocksSection } from './person/StocksSection';

export function PersonView({ who }: { who: PersonKey }) {
  const { model } = useModel();
  const syncs = useSyncs();
  const [people, setPeople] = useDocSync(syncs.people);
  const [plan] = useDocSync(syncs.plan);
  const [section, setSection] = useState<Section>(lastSection);
  const person = people[who];
  const mine = model.hh[who];
  const patch = (p: Partial<Person>) => setPeople(patchPerson(people, who, p));
  const pick = (next: Section) => { rememberSection(next); setSection(next); };
  const body: Record<Section, () => ReactNode> = {
    bank: () => <BankCard banks={person.banks} onChange={(banks) => patch({ banks })} />,
    bonus: () => <BonusCard value={person.opi2} onValue={(opi2) => patch({ opi2 })} />,
    pay: () => (
      <PayCard {...personPay(model.s, who, person.pay)}
        onChange={(month, v) => patch({ pay: withMonthPay(person.pay, month, v) })} />
    ),
    stocks: () => <StocksSection brokers={person.brokers} mine={mine} onChange={(brokers) => patch({ brokers })} />,
    retire: () => <RetireCard input={person.retire} result={mine.retire} onChange={(retire) => patch({ retire })} />,
  };
  const sub = `은행 ${won(mine.bank)} + 주식 팔면 ${won(mine.stocks.afterTax)}`;
  return (
    <div className="page person">
      <PageHead title={plan.names[who]} numLabel="지금 쓸 수 있는 돈" num={won(mine.liquid)} sub={sub} />
      <Tabs tabs={SECTIONS} current={section} onSelect={pick} idPrefix="sec" panelId="section" label="항목 고르기" className="subtabs" />
      <div id="section" role="tabpanel" aria-labelledby={`sec-${section}`} className="section">
        {body[section]()}
      </div>
    </div>
  );
}
