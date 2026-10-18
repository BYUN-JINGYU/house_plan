// 요약: 판정 → 채우는 방법 → 잔금 후 숫자 세 개 | 지금 자산, 바로 바꿔 보기
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { AssetMini } from './summary/AssetMini';
import { FundingBar } from './summary/FundingBar';
import { QuickControls } from './summary/QuickControls';
import { SummaryTiles } from './summary/SummaryTiles';
import { Verdict } from './summary/Verdict';
import type { TabId } from './tabs';

export function SummaryView({ go }: { go: (tab: TabId) => void }) {
  const { model, quotes } = useModel();
  const [plan, setPlan, snap] = useDocSync(useSyncs().plan);
  const { s, c, alt, o, hh, a } = model;
  return (
    <div className="split">
      <section className="col">
        {!snap.stored && (
          <p className="banner">
            지금은 예시 숫자예요.
            <button type="button" className="linkish" onClick={() => go('assume')}>가정 탭에서 우리 값 넣기</button>
          </p>
        )}
        <Verdict s={s} c={c} alt={alt} />
        <FundingBar s={s} c={c} />
        <SummaryTiles s={s} o={o} />
      </section>
      <aside className="card side">
        <AssetMini hh={hh} names={plan.names} quotes={quotes} go={go} />
        <QuickControls plan={plan} setPlan={setPlan} a={a} />
      </aside>
    </div>
  );
}
