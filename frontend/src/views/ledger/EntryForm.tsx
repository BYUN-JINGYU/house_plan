// 가계부 적기·고치기: 날짜, 지출/수입, 분류, 금액(원), 누가, 메모
import { useEffect, useState, type FormEvent } from 'react';
import { LEDGER_CATS, monthOf, type LedgerEntry, type Month, type NewEntry, type Who } from '../../domain/ledger';
import type { Names } from '../../domain/plan';
import { todayKst } from '../../domain/schedule';
import { DateInput, NumberInput, TextInput } from '../../ui/inputs';
import { Seg } from '../../ui/Seg';

interface Props {
  month: Month;
  names: Names;
  editing: LedgerEntry | null;
  onSubmit: (e: NewEntry, id?: number) => Promise<void>;
  onCancel: () => void;
}

const KINDS = [{ value: 'out' as const, text: '지출' }, { value: 'in' as const, text: '수입' }];

function blank(month: Month): NewEntry {
  const today = todayKst();
  return { day: monthOf(today) === month ? today : `${month}-01`, kind: 'out', category: LEDGER_CATS.out[0], amount: 0, who: '', memo: '' };
}

function start(editing: LedgerEntry | null, month: Month): NewEntry {
  if (!editing) return blank(month);
  const { day, kind, category, amount, who, memo } = editing;
  return { day, kind, category, amount, who, memo };
}

export function EntryForm({ month, names, editing, onSubmit, onCancel }: Props) {
  const [draft, setDraft] = useState<NewEntry>(() => start(editing, month));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setDraft(start(editing, month)); setError(''); }, [editing, month]);
  const set = (p: Partial<NewEntry>) => setDraft((d) => ({ ...d, ...p }));

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (draft.amount <= 0) { setError('금액을 넣어 주세요'); return; }
    setBusy(true);
    setError('');
    try {
      await onSubmit({ ...draft, memo: draft.memo.trim() }, editing?.id);
      if (!editing) setDraft({ ...draft, amount: 0, memo: '' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card entry-form" onSubmit={submit}>
      <h2>{editing ? '고치기' : '적기'}</h2>
      <div className="entry-grid">
        <DateInput aria-label="날짜" value={draft.day} onValue={(day) => set({ day })} />
        <Seg label="지출 또는 수입" options={KINDS} value={draft.kind} onChange={(kind) => set({ kind, category: LEDGER_CATS[kind][0] })} />
        <select aria-label="분류" value={draft.category} onChange={(e) => set({ category: e.target.value })}>
          {LEDGER_CATS[draft.kind].map((c) => <option key={c}>{c}</option>)}
        </select>
        <NumberInput kind="wonFull" aria-label="금액 (원)" placeholder="금액 (원)" value={draft.amount} onValue={(amount) => set({ amount })} />
        <select aria-label="누가" value={draft.who} onChange={(e) => set({ who: e.target.value as Who })}>
          <option value="">함께</option>
          <option value="a">{names.a}</option>
          <option value="b">{names.b}</option>
        </select>
        <TextInput aria-label="메모" placeholder="메모 (선택)" maxLength={60} value={draft.memo} onValue={(memo) => set({ memo })} />
      </div>
      <div className="form-foot">
        <button type="submit" className="btn" disabled={busy}>{editing ? '저장' : '추가'}</button>
        {editing && <button type="button" className="btn ghost" onClick={onCancel}>취소</button>}
        {error && <span className="note bad">{error}</span>}
      </div>
    </form>
  );
}
