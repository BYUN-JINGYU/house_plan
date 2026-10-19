// 한 달 대출: 무엇을 얼마 내는지 (잔금 전이면 잔금 뒤 첫 달). 냈으면 도장을 찍는다.
import { pct, won } from '../../domain/format';
import type { LoanRow } from '../../domain/loans';
import { Card, Rows } from '../../ui/bits';
import { Stamp } from '../../ui/Stamp';

interface Props { row: LoanRow; title: string; onPaid?: (paid: boolean) => void }

export function LoanNow({ row, title, onPaid }: Props) {
  return (
    <Card title={title} value={won(row.due)}>
      <Rows rows={[
        { label: '사내대출 이자', note: `연 ${pct(row.coRate, 2)}`, value: won(row.coInt) },
        ...(row.coPrin > 0 ? [{ label: '사내대출 원금', value: won(row.coPrin) }] : []),
        { label: '금고 이자', note: `연 ${pct(row.ggRate, 2)}`, value: won(row.ggInt) },
        { label: '이자 혜택 세금', note: '월급에서 빠져요', value: won(row.lowTax) },
      ]} />
      {row.ggRepay > 0 && <p className="note">이 달 금고 상환 {won(row.ggRepay)}{row.entered ? '' : ' (계획)'}</p>}
      {onPaid && (
        <div className="card-foot stamp-line">
          <Stamp paid={row.paid} label={title} onToggle={() => onPaid(!row.paid)} />
          <span>{row.paid ? '냈어요.' : '냈으면 도장을 찍어요.'}</span>
        </div>
      )}
    </Card>
  );
}
