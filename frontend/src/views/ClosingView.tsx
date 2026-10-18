// 잔금 자금표: 계산식 한 장 | 부대비용 막대, 계약금
import type { Closing } from '../domain/closing';
import { pct, won } from '../domain/format';
import type { Scenario } from '../domain/scenario';
import { dateLabel } from '../domain/schedule';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { HBars, Rows, type Row } from '../ui/bits';

const tone = (v: number) => (v >= 0 ? 'good' : 'bad');

function gapRow(has: boolean, gap: number): Row {
  return { label: has ? (gap >= 0 ? '여유' : '부족') : '여유 / 부족', value: has ? won(gap, { sign: true }) : '—', cls: has ? tone(gap) : '' };
}

function receipt(s: Scenario, c: Closing): Row[] {
  const has = c.have > 0;
  return [
    { label: '집값', value: won(s.price) },
    { op: '+', label: '부대비용', value: won(c.costSum) },
    { op: '−', label: '대출', note: `사내 ${won(s.coLoan)} · 금고 ${won(c.gg)}`, value: won(s.coLoan + c.gg) },
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
    { label: '취득세+지방교육세', note: pct(s.acqRate), v: k.acq },
    { label: '수리', note: '가정', v: k.repair },
    { label: '중개보수', note: '상한', v: k.broker },
    { label: '금고 보증보험료', note: `${s.ggTerm}년`, v: k.guar },
    { label: '이사·입주청소', note: '가정', v: k.move },
    { label: '사내대출 근저당 설정', v: k.lien },
    { label: '국민주택채권 할인', v: k.bond },
    { label: '법무사·인지세', v: k.lawyer + k.stamp + k.ggStamp },
  ].sort((x, y) => y.v - x.v).map((x) => ({ ...x, text: won(x.v) }));
}

export function ClosingView() {
  const { model } = useModel();
  const [plan, setPlan] = useDocSync(useSyncs().plan);
  const { s, c } = model;
  const i = c.inflows;
  const has = c.have > 0;
  return (
    <div className="split even">
      <section className="col">
        <h2>잔금 계산식</h2>
        <Rows rows={receipt(s, c)} />
        <div className="notes">
          <p className="note">모을 돈 = 월급 저축 {won(i.save)} ({s.monthsLeft}번) + PS {won(i.ps)} + PI {won(i.pi)} + 명절 {won(i.holiday)}</p>
          <p className="note">이미 받은 돈은 통장 잔액에 있다고 보고 빼요. 특별성과급은 잔금 뒤라 넣지 않았어요.</p>
        </div>
      </section>
      <section className="col">
        <h2>부대비용 {won(c.costSum)}</h2>
        <HBars items={costs(s, c)} label="부대비용 큰 순서" />
        <h2 className="gap-top">{dateLabel(s.depositDate)} 계약금</h2>
        {plan.depositPaid ? (
          <Rows rows={[{ label: '계약금 냈어요', note: '지금 자산에서 이미 빠진 것으로 계산해요', value: won(c.deposit), cls: 'subtotal' }]} />
        ) : (
          <Rows rows={[
            { label: '계약금', note: `매매가의 ${pct(s.depositRate)}`, value: won(c.deposit) },
            { label: '그때까지 쓸 수 있는 돈', note: `지금 자산 + 월급 ${s.depMonths}번${s.depPiDue ? ' + PI' : ''}`, value: has ? won(c.depCash) : '자산 입력 후' },
            gapRow(has, c.depGap),
          ]} />
        )}
        <label className="check-line">
          <input type="checkbox" checked={plan.depositPaid} onChange={(e) => setPlan({ ...plan, depositPaid: e.target.checked })} />
          계약금 냈어요
        </label>
      </section>
    </div>
  );
}
