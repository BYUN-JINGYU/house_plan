// 자산: 두 사람 중 한 명 고르기(지금 쓸 수 있는 돈) → 항목(은행·성과급·월급·증권·퇴직금)을 하나씩
import { useState, type ReactNode } from 'react';
import { patchPerson } from '../domain/edit';
import { won } from '../domain/format';
import { personPay, withMonthPay } from '../domain/pay';
import { PERSON_KEYS, type Person } from '../domain/people';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { PageHead } from '../ui/bits';
import { Num } from '../ui/Num';
import { Tabs } from '../ui/Tabs';
import { BankCard } from './person/BankCard';
import { BonusCard } from './person/BonusCard';
import { PayCard } from './person/PayCard';
import { RetireCard } from './person/RetireCard';
import { lastPick, rememberPick, SECTIONS, type Pick, type Section } from './person/selection';
import { StocksSection } from './person/StocksSection';

export function AssetsView() {
  const { model } = useModel();
  const syncs = useSyncs();
  const [people, setPeople] = useDocSync(syncs.people);
  const [plan] = useDocSync(syncs.plan);
  const [pick, setPick] = useState<Pick>(lastPick);
  const choose = (p: Partial<Pick>) => { rememberPick(p); setPick((cur) => ({ ...cur, ...p })); };
  const who = pick.person;
  const person = people[who];
  const mine = model.hh[who];
  const patch = (p: Partial<Person>) => setPeople(patchPerson(people, who, p));
  const body: Record<Section, () => ReactNode> = {
    bank: () => <BankCard banks={person.banks} onChange={(banks) => patch({ banks })} />,
    bonus: () => <BonusCard value={person.opi2} onValue={(opi2) => patch({ opi2 })} />,
    pay: () => <PayCard {...personPay(model.s, who, person.pay)} onChange={(month, v) => patch({ pay: withMonthPay(person.pay, month, v) })} />,
    stocks: () => <StocksSection brokers={person.brokers} mine={mine} onChange={(brokers) => patch({ brokers })} />,
    retire: () => <RetireCard input={person.retire} result={mine.retire} onChange={(retire) => patch({ retire })} />,
  };
  const people2 = PERSON_KEYS.map((k) => ({
    id: k,
    label: <><span className="pp-name">{plan.names[k]}</span><span className="pp-val"><Num text={won(model.hh[k].liquid)} /></span></>,
  }));
  return (
    <div className="page">
      <PageHead title="자산" sub={`두 사람이 지금 쓸 수 있는 돈은 ${won(model.hh.a.liquid + model.hh.b.liquid)}이에요.`} />
      <Tabs tabs={people2} current={who} onSelect={(person) => choose({ person })} idPrefix="who" panelId="who-panel" label="사람 고르기" className="people-tabs" />
      <div id="who-panel" role="tabpanel" aria-labelledby={`who-${who}`} className="who-panel">
        <p className="who-line">은행 {won(mine.bank)}, 주식 팔면 {won(mine.stocks.afterTax)}</p>
        <Tabs tabs={SECTIONS} current={pick.section} onSelect={(section) => choose({ section })} idPrefix="sec" panelId="section" label="항목 고르기" className="subtabs" />
        <div id="section" role="tabpanel" aria-labelledby={`sec-${pick.section}`} className="section">{body[pick.section]()}</div>
      </div>
    </div>
  );
}
