// 가계부: 달 고르기 + 숫자 세 개 / 적기 | 생활비 평균 / 이 달 기록 / 분류별 | 최근 달
import { useState } from 'react';
import { setOverride } from '../domain/edit';
import { wonFull } from '../domain/format';
import { monthLabel, monthOf, monthTotals, shiftMonth, type LedgerEntry, type NewEntry } from '../domain/ledger';
import { todayKst } from '../domain/schedule';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { useLedger } from '../state/useLedger';
import { Card, Stat } from '../ui/bits';
import { EntryForm } from './ledger/EntryForm';
import { EntryList } from './ledger/EntryList';
import { CategoryCard, LivingCard, RecentCard } from './ledger/LedgerCards';

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
    <div className="page">
      <div className="month-head">
        <div className="month-nav">
          <button type="button" className="icon-btn" aria-label="이전 달" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
          <h1>{monthLabel(month)}</h1>
          <button type="button" className="icon-btn" aria-label="다음 달" onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
        </div>
        <div className="stats month-stats">
          <Stat label="수입" value={wonFull(t.income)} />
          <Stat label="지출" value={wonFull(t.spend)} />
          <Stat label="남은 돈" value={wonFull(t.left)} tone={t.left < 0 ? 'bad' : ''} />
        </div>
      </div>
      {led.status === 'error' && (
        <p className="note bad">{led.message} <button type="button" className="linkish" onClick={led.reload}>다시 불러오기</button></p>
      )}
      <div className="grid">
        <EntryForm month={month} names={plan.names} editing={editing} onSubmit={submit} onCancel={() => setEditing(null)} />
        <LivingCard entries={led.entries} months={led.months} living={model.a.living}
          onUseLiving={(v) => setPlan(setOverride(plan, 'living', v))} />
      </div>
      <Card title="이 달 기록" value={`${inMonth.length}건`}>
        <EntryList entries={inMonth} names={plan.names} onEdit={setEditing} onRemove={(id) => void led.remove(id)} />
      </Card>
      <div className="grid even">
        <CategoryCard entries={led.entries} month={month} />
        <RecentCard entries={led.entries} months={led.months} />
      </div>
    </div>
  );
}
