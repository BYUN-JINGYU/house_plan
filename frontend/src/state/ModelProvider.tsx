// 문서(계획·사람·대출 기록) + 시세 + 오늘 날짜로 화면 전체가 쓰는 숫자를 한 번 계산해 나눠 준다.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { computeFrom, type PlanInputs, type PlanModel } from '../domain/compute';
import { symbolsOf } from '../domain/people';
import { USDKRW } from '../domain/pricing';
import { todayKst } from '../domain/schedule';
import { useSyncs } from './DataProvider';
import { useDocSync } from './sync';
import { useQuotes, type QuotesState } from './useQuotes';

interface ModelValue {
  model: PlanModel;
  quotes: QuotesState;
  /** 위기 시험처럼 일부를 바꿔 다시 셀 때 쓰는 입력 */
  inputs: PlanInputs;
}

const ModelContext = createContext<ModelValue | null>(null);

function useToday(): string {
  const [today, setToday] = useState(todayKst);
  useEffect(() => {
    const check = () => setToday(todayKst());
    document.addEventListener('visibilitychange', check);
    const timer = setInterval(check, 60 * 60 * 1000);
    return () => { document.removeEventListener('visibilitychange', check); clearInterval(timer); };
  }, []);
  return today;
}

export function ModelProvider({ children }: { children: ReactNode }) {
  const syncs = useSyncs();
  const [plan] = useDocSync(syncs.plan);
  const [people] = useDocSync(syncs.people);
  const [loans] = useDocSync(syncs.loans);
  const today = useToday();
  const keys = useMemo(() => {
    const list = symbolsOf(people);
    return plan.useLiveFx || list.some((k) => k.startsWith('US:')) ? [...list, USDKRW] : list;
  }, [people, plan.useLiveFx]);
  const quotes = useQuotes(keys);
  const inputs = useMemo(() => ({ plan, people, book: quotes.book, asOf: today, log: loans }), [plan, people, quotes.book, today, loans]);
  const model = useMemo(() => computeFrom(inputs), [inputs]);
  const value = useMemo(() => ({ model, quotes, inputs }), [model, quotes, inputs]);
  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModel(): ModelValue {
  const value = useContext(ModelContext);
  if (!value) throw new Error('ModelProvider 안에서만 쓸 수 있어요');
  return value;
}
