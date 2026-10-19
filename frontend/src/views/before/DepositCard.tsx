// 계약금: 그날까지 쓸 수 있는 돈과 여유, '냈어요' 표시 (내면 지금 자산에서 빠진 것으로 본다)
import type { Closing } from '../../domain/closing';
import { won } from '../../domain/format';
import type { PlanDoc } from '../../domain/plan';
import type { Scenario } from '../../domain/scenario';
import { dateLabel } from '../../domain/schedule';
import { Card, Rows } from '../../ui/bits';

interface Props { s: Scenario; c: Closing; plan: PlanDoc; setPlan: (p: PlanDoc) => void }

export function DepositCard({ s, c, plan, setPlan }: Props) {
  const has = c.have > 0;
  const gap = c.depGap;
  return (
    <Card title={`${dateLabel(s.depositDate)} 계약금`} value={won(c.deposit)}>
      {plan.depositPaid ? (
        <p className="sub">냈어요. 지금 자산에서 이미 빠진 것으로 계산해요.</p>
      ) : (
        <Rows rows={[
          { label: '그때까지 쓸 수 있는 돈', note: `지금 자산 + 월급 ${s.depMonths}번${s.depPiDue ? ' + PI' : ''}`, value: has ? won(c.depCash) : '자산 입력 전' },
          { label: has ? (gap >= 0 ? '여유' : '부족') : '여유 또는 부족', value: has ? won(gap, { sign: true }) : '자산 입력 전', cls: has ? (gap >= 0 ? 'good' : 'bad') : '' },
        ]} />
      )}
      <label className="check-line">
        <input type="checkbox" checked={plan.depositPaid} onChange={(e) => setPlan({ ...plan, depositPaid: e.target.checked })} />
        계약금 냈어요
      </label>
    </Card>
  );
}
