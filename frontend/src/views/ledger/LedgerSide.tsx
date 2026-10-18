// 가계부 옆: 분류별 지출, 최근 달 수입·지출, 생활비 평균 → 생활비 가정에 쓰기
import { compactWon, won, wonFull } from '../../domain/format';
import { averageLiving, categoryTotals, monthTotals, type LedgerEntry, type Month, type MonthTotal } from '../../domain/ledger';
import { HBars } from '../../ui/bits';

function MonthBars({ rows }: { rows: MonthTotal[] }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.income, r.spend]));
  const width = (v: number) => ({ width: `${(v / max) * 100}%` });
  return (
    <table className="month-bars">
      <caption>달별 수입·지출 (만원) · 오른쪽은 남은 돈</caption>
      <tbody>
        {rows.map((r) => (
          <tr key={r.month}>
            <th scope="row">{Number(r.month.slice(5))}월</th>
            <td>
              <div className="mb"><span className="bar s1" style={width(r.income)} /><span className="v">{compactWon(r.income / 10000)}</span></div>
              <div className="mb"><span className="bar s2" style={width(r.spend)} /><span className="v">{compactWon(r.spend / 10000)}</span></div>
            </td>
            <td className={r.left < 0 ? 'bad' : ''}>{won(r.left / 10000, { sign: true })}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface Props {
  entries: LedgerEntry[];
  months: Month[];
  month: Month;
  living: number;
  onUseLiving: (v: number) => void;
}

export function LedgerSide({ entries, months, month, living, onUseLiving }: Props) {
  const cats = categoryTotals(entries, month);
  const avg = averageLiving(entries, months);
  const avgMan = Math.round(avg.avg / 10000);
  return (
    <>
      <div className="card">
        <h2>분류별 지출</h2>
        {cats.length
          ? <HBars label="분류별 지출" items={cats.map((c) => ({ label: c.category, v: c.amount, text: wonFull(c.amount) }))} />
          : <p className="hint">지출을 적으면 여기 모여요.</p>}
      </div>
      <div className="card">
        <h2>최근 {months.length}달</h2>
        <ul className="legend"><li><span className="key s1" />수입</li><li><span className="key s2" />지출</li></ul>
        <MonthBars rows={monthTotals(entries, months)} />
      </div>
      <div className="card">
        <h2>생활비 평균 <small>주거·관리비, 대출 상환 뺌</small></h2>
        {avg.count ? (
          <>
            <p className="big-number">{won(avgMan)} <small>/ 월 · {avg.count}달 평균</small></p>
            <p className="note">지금 가정은 {won(living)}이에요.</p>
            <button type="button" className="btn ghost" disabled={avgMan === Math.round(living)} onClick={() => onUseLiving(avgMan)}>
              생활비 가정을 {won(avgMan)}으로
            </button>
          </>
        ) : <p className="hint">지출을 적으면 평균을 내서 생활비 가정에 쓸 수 있어요.</p>}
      </div>
    </>
  );
}
