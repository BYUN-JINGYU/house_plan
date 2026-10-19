// 월 실수령은 어디로: 사내대출 거치 동안 | 원리금 동안 두 막대 (성과급 제외)
import { effectiveCoRate } from '../../domain/closing';
import { pct, won } from '../../domain/format';
import type { Scenario } from '../../domain/scenario';
import { monthlyGroups, type Outlook } from '../../domain/yearly';
import { Card, More } from '../../ui/bits';
import { MonthRow } from './MonthRow';

export function WhereCard({ s, o }: { s: Scenario; o: Outlook }) {
  const graceYear = s.closeYear + Math.round(s.coGrace);
  return (
    <Card title="월 실수령은 어디로" value={won(s.netMonth)}>
      <MonthRow title={`${s.closeYear}년 ${s.closeMonth}월부터`} sub="사내대출 거치" g={monthlyGroups(s, o.rows[0])} />
      <MonthRow title={`${graceYear}년 ${s.closeMonth}월부터`} sub="사내대출 원리금" g={monthlyGroups(s, o.afterGrace)} />
      <More>
        <p>성과급은 빼고 봤어요.</p>
        <p>대출 갚는 돈은 사내대출, 금고 이자, 이자 혜택 과세를 더한 값이에요.</p>
        <p>사내대출 실효금리는 {pct(effectiveCoRate(s), 2)}예요.</p>
      </More>
    </Card>
  );
}
