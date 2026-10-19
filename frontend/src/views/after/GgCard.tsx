// 금고: 지금 잔액, 만기에 남는 돈, 다 갚는 달 + 금리 바뀐 달
import { won } from '../../domain/format';
import { monthLabel } from '../../domain/ledger';
import type { RateChange } from '../../domain/loanlog';
import type { LoanRow, LoanSummary } from '../../domain/loans';
import { Card, Rows } from '../../ui/bits';
import { RateEditor } from './RateEditor';

interface Props { rows: LoanRow[]; sum: LoanSummary; rates: RateChange[]; onRates: (r: RateChange[]) => void }

export function GgCard({ rows, sum, rates, onRates }: Props) {
  const now = sum.now ?? rows[0];
  const due = rows.find((r) => r.maturity);
  return (
    <Card title="금고 대출" value={now ? won(now.ggBal) : undefined}>
      <Rows rows={[
        { label: due ? `${monthLabel(due.month)} 만기에 남는 돈` : '만기에 남는 돈', note: '갚거나 연장해야 해요', value: won(sum.atMaturity), cls: sum.atMaturity > 0.5 ? 'bad' : 'good' },
        { label: '다 갚는 달', note: '계획대로 갚으면', value: sum.ggPaidOff ? monthLabel(sum.ggPaidOff) : '계산 기간 안에 못 갚아요' },
        { label: '첫 해 이자', note: '사내대출 + 금고', value: won(sum.interestYear1) },
      ]} />
      <h3 className="sub-title">금리가 바뀌면</h3>
      <RateEditor rates={rates} from={now?.month ?? ''} base={{ gg: now?.ggRate ?? 0, co: now?.coRate ?? 0 }} onChange={onRates} />
    </Card>
  );
}
