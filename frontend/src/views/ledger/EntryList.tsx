// 고른 달의 가계부 목록 (최근 날짜부터)
import { wonFull } from '../../domain/format';
import type { LedgerEntry } from '../../domain/ledger';
import type { Names } from '../../domain/plan';
import { ConfirmButton } from '../../ui/ConfirmButton';

interface Props {
  entries: LedgerEntry[];
  names: Names;
  onEdit: (e: LedgerEntry) => void;
  onRemove: (id: number) => void;
}

export function EntryList({ entries, names, onEdit, onRemove }: Props) {
  if (!entries.length) return <p className="hint">이 달 기록이 아직 없어요.</p>;
  return (
    <ul className="entries">
      {entries.map((e) => (
        <li key={e.id}>
          <span className="e-day">{Number(e.day.slice(8))}일</span>
          <span className="e-what">
            {e.category}
            {(e.memo || e.who) && <small>{[e.who ? names[e.who] : '', e.memo].filter(Boolean).join(' · ')}</small>}
          </span>
          <strong className={`e-amt ${e.kind}`}>{e.kind === 'in' ? '+' : '−'}{wonFull(e.amount)}</strong>
          <span className="e-tools">
            <button type="button" className="linkish" onClick={() => onEdit(e)}>고치기</button>
            <ConfirmButton className="linkish danger" label="지우기" confirm="정말?" onConfirm={() => onRemove(e.id)} />
          </span>
        </li>
      ))}
    </ul>
  );
}
