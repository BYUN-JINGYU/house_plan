// 잔금: 계산식 | 부대비용 막대, 모을 돈 | 계약금 (한 줄의 두 카드는 높이를 맞춘다)
import type { Closing } from '../domain/closing';
import { pct, won } from '../domain/format';
import type { Scenario } from '../domain/scenario';
import { dateLabel } from '../domain/schedule';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { Card, HBars, PageHead, Rows, type Row } from '../ui/bits';
import { InflowCard } from './closing/InflowCard';

const tone = (v: number) => (v >= 0 ? 'good' : 'bad');

function gapRow(has: boolean, gap: number): Row {
  return { label: has ? (gap >= 0 ? '여유' : '부족') : '여유 또는 부족', value: has ? won(gap, { sign: true }) : '자산 입력 전', cls: has ? tone(gap) : '' };
}

function receipt(s: Scenario, c: Closing): Row[] {
  const has = c.have > 0;
  return [
    { label: '집값', value: won(s.price) },
    { op: '+', label: '부대비용', value: won(c.costSum) },
    { op: '−', label: '대출', note: `사내 ${won(s.coLoan)}, 금고 ${won(c.gg)}`, value: won(s.coLoan + c.gg) },
    ...(c.paid > 0 ? [{ op: '−', label: '이미 낸 계약금', value: won(c.paid) }] : []),
    { op: '−', label: '잔금 전까지 모을 돈', value: won(c.inflow) },
    { op: '+', label: `비상금 ${s.bufferM}개월치`, value: won(c.buffer) },
    { op: '=', label: '지금 있어야 할 돈', value: won(c.reqAll), cls: 'total' },
    { label: '지금 가진 자산', value: has ? won(c.have) : '입력 전' },
    gapRow(has, c.gap),
  ];
}

function costs(s: Scenario, c: Closing) {
  const k = c.costs;
  return [
    { label: '취득세', note: pct(s.acqRate), v: k.acq },
    { label: '수리', v: k.repair },
    { label: '중개보수', note: '상한', v: k.broker },
    { label: '금고 보증보험료', note: `${s.ggTerm}년`, v: k.guar },
    { label: '이사·입주청소', v: k.move },
    { label: '근저당 설정', v: k.lien },
    { label: '국민주택채권', v: k.bond },
    { label: '법무사·인지세', v: k.lawyer + k.stamp + k.ggStamp },
  ].sort((x, y) => y.v - x.v).map((x) => ({ ...x, text: won(x.v) }));
}

export function ClosingView() {
  const { model } = useModel();
  const [plan, setPlan] = useDocSync(useSyncs().plan);
  const { s, c } = model;
  const has = c.have > 0;
  return (
    <div className="page">
      <PageHead title="잔금" sub={`${dateLabel(s.closingDate)} 잔금에 필요한 돈을 계산해요.`} />
      <div className="grid even">
        <Card title="계산식" value={won(c.reqAll)}>
          <Rows rows={receipt(s, c)} />
        </Card>
        <Card title="부대비용" value={won(c.costSum)}>
          <HBars items={costs(s, c)} label="부대비용 큰 순서" />
        </Card>
      </div>
      <div className="grid even">
        <InflowCard s={s} c={c} />
        <Card title={`${dateLabel(s.depositDate)} 계약금`} value={won(c.deposit)}>
          {plan.depositPaid ? (
            <p className="sub">냈어요. 지금 자산에서 이미 빠진 것으로 계산해요.</p>
          ) : (
            <Rows rows={[
              { label: '그때까지 쓸 수 있는 돈', note: `지금 자산 + 월급 ${s.depMonths}번${s.depPiDue ? ' + PI' : ''}`, value: has ? won(c.depCash) : '자산 입력 전' },
              gapRow(has, c.depGap),
            ]} />
          )}
          <label className="check-line">
            <input type="checkbox" checked={plan.depositPaid} onChange={(e) => setPlan({ ...plan, depositPaid: e.target.checked })} />
            계약금 냈어요
          </label>
        </Card>
      </div>
    </div>
  );
}
