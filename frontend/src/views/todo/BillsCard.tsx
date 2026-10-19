// 돈 일정: 오늘이 든 달부터 12달. 날짜가 정해진 돈과 매달 나가는 돈 (통장처럼 달마다 묶음, 오른쪽은 그 달 합)
import type { BillMonth } from '../../domain/bills';
import { won } from '../../domain/format';
import { parseYmd } from '../../domain/schedule';
import { Card } from '../../ui/bits';
import { Num } from '../../ui/Num';

function monthName(month: string, i: number): string {
  const { y, m } = parseYmd(`${month}-01`);
  return i === 0 || m === 1 ? `${y}년 ${m}월` : `${m}월`;
}

export function BillsCard({ months }: { months: BillMonth[] }) {
  const shown = months.filter((x) => x.items.length);
  return (
    <Card title="앞으로 12달 돈 일정">
      {shown.length ? (
        <ol className="list passbook bills">
          {shown.map((x, i) => (
            <li key={x.month}>
              <div className="pb-head">
                <span className="pb-month">{monthName(x.month, i)}</span>
                <span className="pb-bal" aria-label="그 달 합"><Num text={won(x.items.reduce((s, b) => s + b.amount, 0), { sign: true })} /></span>
              </div>
              <ul className="pb-items">
                {x.items.map((b) => (
                  <li key={`${b.label}-${b.day}`}>
                    <span className="pb-date">{b.day ? `${Number(x.month.slice(5))}월 ${b.day}일` : '매달'}</span>
                    <span className="pb-label">{b.label}{b.note && <small>{b.note}</small>}</span>
                    <span className={`pb-amt ${b.amount < 0 ? 'out' : 'in'}`}>{b.amount ? won(b.amount, { sign: true }) : ''}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : <p className="hint">앞으로 12달 동안 정해진 돈 일정이 없어요.</p>}
    </Card>
  );
}
