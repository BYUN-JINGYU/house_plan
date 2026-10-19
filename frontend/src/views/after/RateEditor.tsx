// 금리가 바뀐 달: 그 달부터 새 금리로 다시 센다 (금고는 변동, 사내대출은 회사 공지)
import { useState, type FormEvent } from 'react';
import { pct } from '../../domain/format';
import { monthLabel } from '../../domain/ledger';
import type { LoanKind, RateChange } from '../../domain/loanlog';
import { NumberInput } from '../../ui/inputs';
import { Seg } from '../../ui/Seg';

const KINDS: { value: LoanKind; text: string }[] = [{ value: 'gg', text: '금고' }, { value: 'co', text: '사내대출' }];
const NAME: Record<LoanKind, string> = { gg: '금고', co: '사내대출' };

interface Props { rates: RateChange[]; from: string; base: Record<LoanKind, number>; onChange: (rates: RateChange[]) => void }

export function RateEditor({ rates, from, base, onChange }: Props) {
  const [loan, setLoan] = useState<LoanKind>('gg');
  const [month, setMonth] = useState(from);
  const [rate, setRate] = useState(base.gg);
  const pickLoan = (k: LoanKind) => { setLoan(k); setRate(base[k]); };
  const valid = /^\d{4}-\d{2}$/.test(month) && rate > 0 && rate < 0.3;
  const add = (ev: FormEvent) => {
    ev.preventDefault();
    if (!valid) return;
    onChange([...rates, { id: crypto.randomUUID(), month, loan, rate }]);
  };
  const sorted = [...rates].sort((x, y) => (x.month < y.month ? -1 : 1));
  return (
    <div className="rates">
      {sorted.length > 0 && (
        <ul className="list rate-list">
          {sorted.map((r) => (
            <li key={r.id}>
              <span>{monthLabel(r.month)}부터 {NAME[r.loan]} 연 {pct(r.rate, 2)}</span>
              <button type="button" className="icon-btn" aria-label={`${monthLabel(r.month)} 금리 변경 지우기`}
                onClick={() => onChange(rates.filter((x) => x.id !== r.id))}>×</button>
            </li>
          ))}
        </ul>
      )}
      <form className="rate-add" onSubmit={add}>
        <Seg label="어느 대출" options={KINDS} value={loan} onChange={pickLoan} />
        <input className="text-input" type="month" aria-label="바뀐 달" value={month} onChange={(e) => setMonth(e.target.value)} />
        <NumberInput kind="pct" aria-label="새 금리 (연)" placeholder="새 금리 %" value={rate} onValue={setRate} />
        <button type="submit" className="btn ghost" disabled={!valid}>추가</button>
      </form>
    </div>
  );
}
