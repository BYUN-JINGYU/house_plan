// 가계부: 고른 달까지 6달치를 불러와서 목록·합계·그래프에 쓴다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ledger } from '../api/endpoints';
import { lastMonths, monthRange, type LedgerEntry, type Month, type NewEntry } from '../domain/ledger';

export const WINDOW = 6;

export function useLedger(month: Month) {
  const months = useMemo(() => lastMonths(month, WINDOW), [month]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const ticket = useRef(0);
  const from = monthRange(months[0]).from;
  const to = monthRange(month).to;

  const reload = useCallback(() => {
    const mine = ++ticket.current;
    setStatus('loading');
    ledger.list(from, to)
      .then((list) => { if (mine === ticket.current) { setEntries(list); setStatus('ok'); } })
      .catch((err: Error) => { if (mine === ticket.current) { setMessage(err.message); setStatus('error'); } });
  }, [from, to]);

  useEffect(reload, [reload]);

  const inWindow = (e: LedgerEntry) => e.day >= from && e.day <= to;

  const add = async (e: NewEntry) => {
    const saved = await ledger.add(e);
    if (inWindow(saved)) setEntries((list) => [saved, ...list]);
    return saved;
  };

  const update = async (id: number, e: NewEntry) => {
    const saved = await ledger.update(id, e);
    setEntries((list) => list.map((x) => (x.id === id ? saved : x)).filter(inWindow));
  };

  const remove = async (id: number) => {
    await ledger.remove(id);
    setEntries((list) => list.filter((x) => x.id !== id));
  };

  return { months, entries, status, message, reload, add, update, remove };
}
