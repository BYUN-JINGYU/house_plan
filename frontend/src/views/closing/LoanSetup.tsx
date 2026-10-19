// 잔금일에 받는 대출: 사내대출(금리·거치·상환), 금고(사람별, 금리·만기), 보증보험료
import type { Closing } from '../../domain/closing';
import { pct, won } from '../../domain/format';
import type { Names } from '../../domain/plan';
import type { Scenario } from '../../domain/scenario';
import { Card, Rows } from '../../ui/bits';

export function LoanSetup({ s, c, names }: { s: Scenario; c: Closing; names: Names }) {
  return (
    <Card title="잔금일에 받는 대출" value={won(s.coLoan + c.gg)}>
      <Rows rows={[
        { label: `사내대출 (${names.a})`, note: `연 ${pct(s.coRate, 2)}, ${s.coGrace}년 이자만 내고 ${s.coTerm}년 원리금`, value: won(s.coLoan) },
        { label: `금고 대출 (${names.a})`, note: `연 ${pct(s.ggRate, 2)}, ${s.ggTerm}년 뒤 한 번에`, value: won(s.ggA) },
        { label: `금고 대출 (${names.b})`, note: `연 ${pct(s.ggRate, 2)}, ${s.ggTerm}년 뒤 한 번에`, value: won(s.ggB) },
        { label: '금고 보증보험료', note: `${s.ggTerm}년치를 잔금 때 내요`, value: won(c.costs.guar) },
      ]} />
      <p className="hint">금리와 기간은 가정 탭에서 바꿔요.</p>
    </Card>
  );
}
