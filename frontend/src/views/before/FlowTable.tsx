// 달마다 흐름 (통장처럼): 그 달에 들어오고 나간 줄과 달 끝 잔액. 잔금 달은 강조하고, 끝에 비상금을 빼서 판정과 맞춘다.
import type { FlowMonth } from '../../domain/before';
import { won } from '../../domain/format';
import { dateLabel, parseYmd } from '../../domain/schedule';
import { Card, Rows } from '../../ui/bits';
import { Num } from '../../ui/Num';

interface Props { rows: FlowMonth[]; have: number; buffer: number; bufferM: number; gap: number }

function monthName(month: string, i: number): string {
  const { y, m } = parseYmd(`${month}-01`);
  return i === 0 || m === 1 ? `${y}년 ${m}월` : `${m}월`;
}

export function FlowTable({ rows, have, buffer, bufferM, gap }: Props) {
  const end = rows.at(-1)?.balance ?? have;
  return (
    <Card title="달마다 들어오고 나가는 돈" value={have > 0 ? undefined : '자산 입력 전'}>
      <p className="note">{have > 0 ? `지금 자산 ${won(have)}에서 시작해요.` : '자산을 넣기 전이라 0에서 시작해요.'}</p>
      <ol className="list passbook">
        {rows.map((r, i) => (
          <li key={r.month} className={r.closing ? 'closing' : ''}>
            <div className="pb-head">
              <span className="pb-month">{monthName(r.month, i)}</span>
              <span className="pb-bal" aria-label="달 끝 잔액"><Num text={won(r.balance)} /></span>
            </div>
            <ul className="pb-items">
              {r.items.map((x) => (
                <li key={`${x.label}-${x.date}`}>
                  <span className="pb-date">{dateLabel(x.date)}</span>
                  <span className="pb-label">{x.label}</span>
                  <span className={`pb-amt ${x.amount < 0 ? 'out' : 'in'}`}>{won(x.amount, { sign: true })}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <Rows rows={[
        { label: '잔금 뒤 남는 돈', value: won(end) },
        { op: '−', label: `비상금 ${bufferM}개월치`, value: won(buffer) },
        { op: '=', label: gap >= 0 ? '여유' : '부족', value: won(gap, { sign: true }), cls: `total ${gap >= 0 ? 'good' : 'bad'}` },
      ]} />
    </Card>
  );
}
