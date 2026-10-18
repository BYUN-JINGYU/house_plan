// 퇴직금 중간정산 (최후의 보루): 제도, 근속, 퇴직소득세, 실수령, 잔금에 넣을지
import { won } from '../../domain/format';
import type { RetireInput, RetirePlan, Severance } from '../../domain/retire';
import { Rows } from '../../ui/bits';
import { DateInput, NumberInput } from '../../ui/inputs';
import { Seg } from '../../ui/Seg';

const PLANS: { value: RetirePlan; text: string }[] = [
  { value: 'severance', text: '퇴직금' }, { value: 'dc', text: 'DC형' }, { value: 'db', text: 'DB형' },
];

interface Props { input: RetireInput; result: Severance | null; onChange: (r: RetireInput) => void }

export function RetireCard({ input, result, onChange }: Props) {
  const set = (patch: Partial<RetireInput>) => onChange({ ...input, ...patch });
  return (
    <div className="card">
      <div className="card-head">
        <h2>퇴직금 중간정산 <small>최후의 보루</small></h2>
        {result?.allowed && <strong>{won(result.net)}</strong>}
      </div>
      <Seg label="퇴직급여 제도" options={PLANS} value={input.plan} onChange={(plan) => set({ plan })} />
      <div className="pair">
        <label className="fld"><span>입사일</span><DateInput value={input.start} onValue={(start) => set({ start })} /></label>
        <label className="fld"><span>정산 기준일</span><DateInput value={input.date} onValue={(date) => set({ date })} /></label>
        <label className="fld"><span>월 평균임금 <small>만원</small></span>
          <NumberInput kind="won" value={input.pay} onValue={(pay) => set({ pay })} placeholder="최근 3개월 평균" /></label>
        <label className="fld"><span>회사 조회액 <small>있으면 우선</small></span>
          <NumberInput kind="won" value={input.quote} onValue={(quote) => set({ quote })} placeholder="만원" /></label>
      </div>
      {result ? (
        <Rows rows={[
          { label: '근속', value: `${result.years}년 (${result.days.toLocaleString('ko-KR')}일)` },
          { label: result.estimated ? '퇴직금 (추정)' : '퇴직금 (조회액)', value: won(result.amount) },
          { label: '퇴직소득세 + 지방세', value: won(-(result.tax + result.local)) },
          { label: '실수령', value: won(result.net), cls: 'total' },
        ]} />
      ) : (
        <p className="hint">입사일과 기준일을 넣으면 세금까지 계산해요.</p>
      )}
      {input.plan === 'db'
        ? <p className="note bad">DB형은 중간정산이 안 돼요.</p>
        : <p className="note">무주택자가 본인 명의로 집을 살 때 돼요. 공동명의는 회사에 확인하세요.</p>}
      <label className="check-line">
        <input type="checkbox" checked={input.use} disabled={!result?.allowed} onChange={(e) => set({ use: e.target.checked })} />
        잔금 자금에 넣기
      </label>
    </div>
  );
}
