// 요약 맨 아래 '바로 바꿔 보기': 생활비, 금고 1인 금액, 잔금 후 PS (넓으면 세 칸 나란히)
import type { Assumptions } from '../../domain/assumptions';
import { setOverride } from '../../domain/edit';
import { won } from '../../domain/format';
import type { PlanDoc } from '../../domain/plan';
import { Card } from '../../ui/bits';
import { Seg } from '../../ui/Seg';

interface Props { plan: PlanDoc; setPlan: (p: PlanDoc) => void; a: Assumptions }

const GG = [10000, 20000, 30000].map((v) => ({ value: v, text: won(v) }));
const PS = [0, 0.25, 0.5].map((v) => ({ value: v, text: `${v * 100}%` }));

export function QuickControls({ plan, setPlan, a }: Props) {
  const gg = a.ggA === a.ggB ? a.ggA : -1;
  return (
    <Card title="바로 바꿔 보기" className="quick">
      <div className="quick-grid">
        <div>
          <div className="fld-row">
            <label htmlFor="q-living">한 달 생활비</label>
            <output htmlFor="q-living">{won(a.living)}</output>
          </div>
          <input id="q-living" type="range" min={200} max={500} step={10} value={a.living}
            onChange={(e) => setPlan(setOverride(plan, 'living', Number(e.target.value)))} />
        </div>
        <div>
          <p className="fld-row"><span>금고 대출 (한 사람)</span></p>
          <Seg label="금고 대출 한 사람" options={GG} value={gg}
            onChange={(v) => setPlan(setOverride(setOverride(plan, 'ggA', v), 'ggB', v))} />
        </div>
        <div>
          <p className="fld-row"><span>잔금 뒤 해마다 PS</span><small>계약연봉 대비</small></p>
          <Seg label="잔금 뒤 해마다 PS" options={PS} value={a.psLater} onChange={(v) => setPlan(setOverride(plan, 'psLater', v))} />
        </div>
      </div>
    </Card>
  );
}
