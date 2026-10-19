// 한눈에: 판정과 세 단계 / 점검할 것 / 잔금에 필요한 돈 | 지금 자산 / 잔금 후 숫자 셋 / 위기 시험 / 바로 바꿔 보기
import { useMemo } from 'react';
import { insights } from '../domain/insights';
import type { PersonKey } from '../domain/people';
import { portfolio } from '../domain/portfolio';
import { stressTest } from '../domain/stress';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { AssetMini } from './home/AssetMini';
import { FundingBar } from './home/FundingBar';
import { Hero } from './home/Hero';
import { InsightsCard } from './home/InsightsCard';
import { QuickControls } from './home/QuickControls';
import { StressCard } from './home/StressCard';
import { SummaryTiles } from './home/SummaryTiles';
import { rememberPick } from './person/selection';
import type { TabId } from './tabs';

export function HomeView({ go }: { go: (tab: TabId) => void }) {
  const { model, quotes, inputs } = useModel();
  const [plan, setPlan, snap] = useDocSync(useSyncs().plan);
  const { s, c, o, hh, a } = model;
  const stress = useMemo(() => stressTest(inputs), [inputs]);
  const notes = useMemo(() => {
    const ports = (['a', 'b'] as const).map((k) => ({ name: plan.names[k], p: portfolio(inputs.people[k].brokers, hh[k].stocks, model.rates) }));
    return insights(model, stress, ports);
  }, [model, stress, inputs.people, hh, plan.names]);
  const openPerson = (person: PersonKey) => { rememberPick({ person }); go('assets'); };
  return (
    <div className="page">
      {!snap.stored && (
        <p className="banner">
          지금은 예시 숫자예요.
          <button type="button" className="linkish" onClick={() => go('assume')}>가정 탭에서 우리 값 넣기</button>
        </p>
      )}
      <Hero model={model} go={go} />
      <InsightsCard list={notes} go={go} />
      <div className="grid">
        <FundingBar s={s} c={c} />
        <AssetMini hh={hh} names={plan.names} quotes={quotes} onPerson={openPerson} />
      </div>
      <SummaryTiles s={s} o={o} sum={model.loanSum} />
      <StressCard t={stress} hasAssets={c.have > 0} />
      <QuickControls plan={plan} setPlan={setPlan} a={a} />
    </div>
  );
}
