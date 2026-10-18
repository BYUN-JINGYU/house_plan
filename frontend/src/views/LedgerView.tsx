// 가계부: 달 고르기 + 합계 | 적기, 목록 | 분류별, 최근 달, 생활비 평균
import { useState } from 'react';
import { setOverride } from '../domain/edit';
import { wonFull } from '../domain/format';
import { monthLabel, monthOf, monthTotals, shiftMonth, type LedgerEntry, type NewEntry } from '../domain/ledger';
import { todayKst } from '../domain/schedule';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { useLedger } from '../state/useLedger';
import { Tile } from '../ui/bits';
import { EntryForm } from './ledger/EntryForm';
import { EntryList } from './ledger/EntryList';
import { LedgerSide } from './ledger/LedgerSide';

export function LedgerView() {
  const [month, setMonth] = useState(() => monthOf(todayKst()));
  const [editing, setEditing] = useState<LedgerEntry | null>(null);
  const led = useLedger(month);
  const [plan, setPlan] = useDocSync(useSyncs().plan);
  const { model } = useModel();
  const inMonth = led.entries.filter((e) => monthOf(e.day) === month);
  const [t] = monthTotals(led.entries, [month]);

  const submit = async (e: NewEntry, id?: number) => {
    if (id == null) { await led.add(e); return; }
    await led.update(id, e);
    setEditing(null);
  };

  return (
    <div className="ledger-view">
      <div className="month-bar">
        <div className="month-nav">
          <button type="button" className="icon-btn" aria-label="이전 달" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
          <h2>{monthLabel(month)}</h2>
          <button type="button" className="icon-btn" aria-label="다음 달" onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
        </div>
        <div className="tiles small">
          <Tile label="수입" value={wonFull(t.income)} />
          <Tile label="지출" value={wonFull(t.spend)} />
          <Tile label="남은 돈" value={wonFull(t.left)} tone={t.left < 0 ? 'bad' : undefined} />
        </div>
      </div>
      {led.status === 'error' && (
        <p className="note bad">{led.message} <button type="button" className="linkish" onClick={led.reload}>다시</button></p>
      )}
      <div className="split">
        <section className="col">
          <EntryForm month={month} names={plan.names} editing={editing} onSubmit={submit} onCancel={() => setEditing(null)} />
          <EntryList entries={inMonth} names={plan.names} onEdit={setEditing} onRemove={(id) => void led.remove(id)} />
        </section>
        <aside className="col">
          <LedgerSide entries={led.entries} months={led.months} month={month} living={model.a.living}
            onUseLiving={(v) => setPlan(setOverride(plan, 'living', v))} />
        </aside>
      </div>
    </div>
  );
}
