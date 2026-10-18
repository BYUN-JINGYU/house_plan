// 보유 종목 시세 받기. 종목 목록이 바뀌면 잠깐 기다렸다가 한 번에 묻는다.
import { useCallback, useEffect, useRef, useState } from 'react';
import { quotes } from '../api/endpoints';
import type { QuoteBook } from '../domain/pricing';

export type QuoteStatus = 'idle' | 'loading' | 'ok' | 'error';

export interface QuotesState {
  book: QuoteBook;
  status: QuoteStatus;
  missing: string[];
  message: string;
  refresh: () => void;
}

export function useQuotes(keys: string[]): QuotesState {
  const [book, setBook] = useState<QuoteBook>({});
  const [status, setStatus] = useState<QuoteStatus>('idle');
  const [missing, setMissing] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const ticket = useRef(0);
  const signature = keys.join(',');

  const load = useCallback(async (force: boolean) => {
    const mine = ++ticket.current;
    if (!signature) { setBook({}); setMissing([]); setStatus('ok'); return; }
    setStatus('loading');
    try {
      const out = await quotes.get(signature.split(','), force);
      if (mine !== ticket.current) return;
      setBook(out.quotes);
      setMissing(out.missing);
      setStatus('ok');
    } catch (err) {
      if (mine !== ticket.current) return;
      setMessage((err as Error).message);
      setStatus('error');
    }
  }, [signature]);

  useEffect(() => {
    const timer = setTimeout(() => void load(false), 500);
    return () => clearTimeout(timer);
  }, [load]);

  return { book, status, missing, message, refresh: () => void load(true) };
}
