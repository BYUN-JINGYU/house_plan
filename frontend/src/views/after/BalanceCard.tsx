// 대출 잔액과 모은 돈: 해마다 그래프 (계획 기준), 표로도 보기
import { useState } from 'react';
import { ggTotal } from '../../domain/closing';
import { axisWon, compactWon, won } from '../../domain/format';
import type { Scenario } from '../../domain/scenario';
import type { Outlook } from '../../domain/yearly';
import { Card } from '../../ui/bits';
import { LineChart } from '../../ui/LineChart';
import { YearTable } from './YearTable';

function chartData(s: Scenario, o: Outlook) {
  const at = (pick: (r: Outlook['rows'][number]) => number, start: number) => [start, ...o.rows.map(pick)];
  return {
    labels: ['잔금', ...o.rows.map((r) => String(s.closeYear + r.t))],
    fullLabels: ['잔금 직후', ...o.rows.map((r) => `${r.period} 끝`)],
    series: [
      { name: '사내대출 잔액', short: '사내', cls: 's1', values: at((r) => r.coEnd, s.coLoan) },
      { name: '금고 잔액', short: '금고', cls: 's2', values: at((r) => r.ggEnd, ggTotal(s)) },
      { name: '모은 돈', short: '모은 돈', cls: 's3', values: at((r) => r.saved, 0) },
    ],
  };
}

export function BalanceCard({ s, o }: { s: Scenario; o: Outlook }) {
  const [table, setTable] = useState(false);
  const data = chartData(s, o);
  return (
    <Card title="대출 잔액과 모은 돈">
      <ul className="legend">
        {data.series.map((x) => <li key={x.cls} className={x.cls}><span className="key" />{x.name}</li>)}
      </ul>
      <LineChart {...data} label="대출 잔액과 모은 돈 그래프" helpId="chart-help" format={won} axisFormat={axisWon} endFormat={compactWon} />
      <p className="note" id="chart-help">계획대로 남는 돈을 금고부터 갚는다고 봤어요.</p>
      <div className="card-foot">
        <button type="button" className="linkish" aria-expanded={table} onClick={() => setTable(!table)}>
          {table ? '표 닫기' : '해마다 숫자를 표로 보기'}
        </button>
      </div>
      {table && <YearTable o={o} />}
    </Card>
  );
}
