// 잔금 전 월급 (실수령): 월급날마다 한 줄. 비운 달은 기본값으로 계산한다.
import { won } from '../../domain/format';
import type { Month, PayRow } from '../../domain/pay';
import { parseYmd } from '../../domain/schedule';
import { Card, More } from '../../ui/bits';
import { NumberInput } from '../../ui/inputs';

interface Props { rows: PayRow[]; fallback: number; total: number; onChange: (month: Month, value: number) => void }

/** 첫 줄과 1월에는 해를 붙인다 */
function when(row: PayRow, i: number): string {
  const { y, m, d } = parseYmd(row.date);
  return i === 0 || m === 1 ? `${y}년 ${m}월 ${d}일` : `${m}월 ${d}일`;
}

export function PayCard({ rows, fallback, total, onChange }: Props) {
  return (
    <Card title="잔금 전 월급 (실수령)" value={won(total)}>
      {rows.length === 0 ? (
        <p className="hint">잔금 전에 남은 월급날이 없어요.</p>
      ) : (
        <ul className="list pay-list">
          {rows.map((r, i) => (
            <li key={r.month}>
              <span className="when">{when(r, i)}</span>
              <NumberInput kind="won" aria-label={`${when(r, i)} 월급 (만원)`} placeholder={won(fallback)}
                value={r.entered ?? 0} onValue={(v) => onChange(r.month, v)} />
            </li>
          ))}
        </ul>
      )}
      <p className="hint">비운 달은 {won(fallback)}으로 계산해요.</p>
      <More>
        <p className="note">가정 탭의 월 실수령(둘 합계)을 계약연봉 비율로 나눈 값이에요.</p>
        <p className="note">이미 받은 월급은 은행 잔액에 넣어요.</p>
      </More>
    </Card>
  );
}
