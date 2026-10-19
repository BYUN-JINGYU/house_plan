// 잔금 후: 월 실수령이 어디로 가는지 두 막대 | 대출 잔액·모은 돈 그래프, 표
import { useState } from 'react';
import { effectiveCoRate, ggTotal } from '../domain/closing';
import { axisWon, compactWon, pct, won } from '../domain/format';
import type { Scenario } from '../domain/scenario';
import { monthlyGroups, type Outlook } from '../domain/yearly';
import { useModel } from '../state/ModelProvider';
import { Card, More, PageHead } from '../ui/bits';
import { LineChart } from '../ui/LineChart';
import { MonthRow } from './after/MonthRow';
import { YearTable } from './after/YearTable';

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

export function AfterView() {
  const { model } = useModel();
  const { s, o } = model;
  const [table, setTable] = useState(false);
  const graceYear = s.closeYear + Math.round(s.coGrace);
  const data = chartData(s, o);
  return (
    <div className="page">
      <PageHead title="잔금 후" sub="월급이 어디로 가고, 대출이 언제 줄어드는지 봐요." />
      <div className="grid even">
        <Card title="월 실수령은 어디로" value={won(s.netMonth)}>
          <MonthRow title={`${s.closeYear}년 ${s.closeMonth}월부터`} sub="사내대출 거치" g={monthlyGroups(s, o.rows[0])} />
          <MonthRow title={`${graceYear}년 ${s.closeMonth}월부터`} sub="사내대출 원리금" g={monthlyGroups(s, o.afterGrace)} />
          <More>
            <p>성과급은 빼고 봤어요.</p>
            <p>대출 갚는 돈은 사내대출, 금고 이자, 이자 혜택 과세를 더한 값이에요.</p>
            <p>사내대출 실효금리는 {pct(effectiveCoRate(s), 2)}예요.</p>
          </More>
        </Card>
        <Card title="대출 잔액과 모은 돈">
          <ul className="legend">
            {data.series.map((x) => <li key={x.cls} className={x.cls}><span className="key" />{x.name}</li>)}
          </ul>
          <LineChart {...data} label="대출 잔액과 모은 돈 그래프" helpId="chart-help" format={won} axisFormat={axisWon} endFormat={compactWon} />
          <p className="note" id="chart-help">남는 돈은 금고부터 갚는다고 봤어요.</p>
          <div className="card-foot">
            <button type="button" className="linkish" aria-expanded={table} onClick={() => setTable(!table)}>
              {table ? '표 닫기' : '해마다 숫자를 표로 보기'}
            </button>
          </div>
          {table && <YearTable o={o} />}
        </Card>
      </div>
    </div>
  );
}
