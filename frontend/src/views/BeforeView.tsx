// 구매 전: 잔금 전까지 모을 돈 | 계약금 / 달마다 들어오고 나가는 돈 (오늘 → 잔금)
import { dateLabel } from '../domain/schedule';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { PageHead } from '../ui/bits';
import { DepositCard } from './before/DepositCard';
import { FlowTable } from './before/FlowTable';
import { InflowCard } from './before/InflowCard';

export function BeforeView() {
  const { model } = useModel();
  const [plan, setPlan] = useDocSync(useSyncs().plan);
  const { s, c, flow } = model;
  if (!flow.length) {
    return (
      <div className="page">
        <PageHead title="구매 전" sub={`${dateLabel(s.closingDate)} 잔금이 지났어요. 구매 후 탭에서 대출을 관리해요.`} />
      </div>
    );
  }
  return (
    <div className="page">
      <PageHead title="구매 전" sub="오늘부터 잔금까지 달마다 들어오고 나가는 돈이에요." />
      <div className="grid even">
        <InflowCard s={s} c={c} />
        <DepositCard s={s} c={c} plan={plan} setPlan={setPlan} />
      </div>
      <FlowTable rows={flow} have={c.have} buffer={c.buffer} bufferM={s.bufferM} gap={c.gap} />
    </div>
  );
}
