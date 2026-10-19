// 구입일: 계산식 | 부대비용 막대 / 잔금일에 받는 대출 | 잔금 뒤 첫 달
import type { Closing } from '../domain/closing';
import { pct, won } from '../domain/format';
import type { Scenario } from '../domain/scenario';
import { dateLabel } from '../domain/schedule';
import { monthLabel } from '../domain/ledger';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { Card, HBars, PageHead, Rows, type Row } from '../ui/bits';
import { LoanNow } from './after/LoanNow';
import { LoanSetup } from './closing/LoanSetup';

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
  const [plan] = useDocSync(useSyncs().plan);
  const { s, c, loans } = model;
  const first = loans[0];
  return (
    <div className="page">
      <PageHead title="구입일" sub={`${dateLabel(s.closingDate)} 잔금에 필요한 돈을 계산해요.`} />
      <div className="grid even">
        <Card title="계산식" value={won(c.reqAll)}>
          <Rows rows={receipt(s, c)} />
        </Card>
        <Card title="부대비용" value={won(c.costSum)}>
          <HBars items={costs(s, c)} label="부대비용 큰 순서" />
        </Card>
      </div>
      <div className="grid even">
        <LoanSetup s={s} c={c} names={plan.names} />
        {first && <LoanNow row={first} title={`잔금 뒤 첫 달 (${monthLabel(first.month)})`} />}
      </div>
    </div>
  );
}
