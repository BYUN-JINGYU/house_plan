// 위기 시험: 한 가지만 나빠지면 세 숫자가 지금 계획보다 얼마나 바뀌는지 (나빠지면 빨강 + 부호, 그대로면 '그대로').
// 폰에서는 줄마다 작은 카드로 (칸 이름은 data-label)
import { won } from '../../domain/format';
import type { StressResult } from '../../domain/stress';
import { Card } from '../../ui/bits';

function Delta({ v, upIsGood }: { v: number; upIsGood: boolean }) {
  if (Math.abs(v) < 0.5) return <span className="muted">그대로</span>;
  return <span className={(v > 0) === upIsGood ? 'good' : 'bad'}>{won(v, { sign: true })}</span>;
}

export function StressCard({ t, hasAssets }: { t: StressResult; hasAssets: boolean }) {
  return (
    <Card title="위기 시험">
      <p className="note">지금 계획에서 한 가지만 나빠지면 얼마나 바뀌는지예요.</p>
      <div className="table-wrap">
        <table className="stress-table">
          <thead>
            <tr><th scope="col">이런 일이 생기면</th><th scope="col">잔금 여유·부족</th><th scope="col">잔금 뒤 매달 남는 돈</th><th scope="col">금고 만기에 남는 돈</th></tr>
          </thead>
          <tbody>
            <tr className="base">
              <th scope="row">지금 계획</th>
              <td data-label="잔금 여유·부족">{hasAssets ? won(t.base.gap, { sign: true }) : '자산 입력 전'}</td>
              <td data-label="매달 남는 돈">{won(t.base.monthly)}</td>
              <td data-label="금고 만기 남는 돈">{won(t.base.maturity)}</td>
            </tr>
            {t.rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.label}</th>
                <td data-label="잔금 여유·부족"><Delta v={r.d.gap} upIsGood /></td>
                <td data-label="매달 남는 돈"><Delta v={r.d.monthly} upIsGood /></td>
                <td data-label="금고 만기 남는 돈"><Delta v={r.d.maturity} upIsGood={false} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
