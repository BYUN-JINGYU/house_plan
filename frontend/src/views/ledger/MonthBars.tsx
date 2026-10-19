// 최근 달 수입·지출 막대. 기록이 없는 달은 막대 대신 '기록 없음'.
import { compactWon, won } from '../../domain/format';
import type { MonthTotal } from '../../domain/ledger';

export function MonthBars({ rows }: { rows: MonthTotal[] }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.income, r.spend]));
  const width = (v: number) => ({ width: `${(v / max) * 100}%` });
  return (
    <table className="month-bars">
      <caption>막대 옆은 만원, 오른쪽 끝은 남은 돈</caption>
      <tbody>
        {rows.map((r) => (
          <tr key={r.month}>
            <th scope="row">{Number(r.month.slice(5))}월</th>
            {r.income || r.spend ? (
              <>
                <td>
                  <div className="mb s1"><span className="bar" style={width(r.income)} /><span className="v">{compactWon(r.income / 10000)}</span></div>
                  <div className="mb s2"><span className="bar" style={width(r.spend)} /><span className="v">{compactWon(r.spend / 10000)}</span></div>
                </td>
                <td className={r.left < 0 ? 'bad' : ''}>{won(r.left / 10000, { sign: true })}</td>
              </>
            ) : <td className="empty" colSpan={2}>기록 없음</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
