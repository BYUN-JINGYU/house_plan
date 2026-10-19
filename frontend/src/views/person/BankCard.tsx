// 은행 계좌 목록 (이름, 잔액 만원)
import { newBank, patchIn, removeFrom } from '../../domain/edit';
import { won } from '../../domain/format';
import type { Bank } from '../../domain/people';
import { Card } from '../../ui/bits';
import { NumberInput, TextInput } from '../../ui/inputs';

export function BankCard({ banks, onChange }: { banks: Bank[]; onChange: (b: Bank[]) => void }) {
  const total = banks.reduce((s, b) => s + (b.amount || 0), 0);
  return (
    <Card title="은행 계좌" value={won(total)}>
      <ul className="list edit-list">
        {banks.map((b) => (
          <li key={b.id} className="line">
            <TextInput aria-label="계좌 이름" placeholder="예: 월급 통장" value={b.name}
              onValue={(name) => onChange(patchIn(banks, b.id, { name }))} />
            <NumberInput kind="won" aria-label="잔액 (만원)" placeholder="잔액 (만원)" value={b.amount}
              onValue={(amount) => onChange(patchIn(banks, b.id, { amount }))} />
            <button type="button" className="icon-btn" aria-label="이 계좌 지우기" onClick={() => onChange(removeFrom(banks, b.id))}>×</button>
          </li>
        ))}
      </ul>
      <div className="card-foot">
        <button type="button" className="linkish" onClick={() => onChange([...banks, newBank()])}>+ 계좌 추가</button>
      </div>
      <p className="hint">예금, 적금, 파킹통장을 만원 단위로 넣어요.</p>
    </Card>
  );
}
