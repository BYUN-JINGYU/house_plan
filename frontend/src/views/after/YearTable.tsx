// 연도별 표 (그래프를 표로 보기)
import { won } from '../../domain/format';
import type { Outlook } from '../../domain/yearly';

const HEAD = ['기간', '특별성과급 매도', '남는 돈', '금고 잔액', '사내대출 잔액', '모은 돈', '월 평균 여유'];

export function YearTable({ o }: { o: Outlook }) {
  return (
    <div className="table-wrap">
      <table>
        <caption>1년 합계, 잔액은 기간 끝 기준</caption>
        <thead><tr>{HEAD.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>
          {o.rows.map((r) => (
            <tr key={r.t}>
              <th scope="row">{r.period}</th>
              <td>{won(r.tranche)}</td>
              <td>{won(r.surplus)}</td>
              <td>{won(r.ggEnd)}</td>
              <td>{won(r.coEnd)}</td>
              <td>{won(r.saved)}</td>
              <td>{won(r.surplus / 12)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
