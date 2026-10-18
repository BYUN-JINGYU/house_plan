// 로그인 뒤 문서 3개(계획·사람·할 일)를 한 번 읽어 와서 화면 전체에 나눠 준다.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { LOGGED_IN } from '../api/client';
import { docs } from '../api/endpoints';
import { normalizeChecks, type ChecksDoc } from '../domain/checks';
import { normalizePeople, type People } from '../domain/people';
import { normalizePlan, type PlanDoc } from '../domain/plan';
import { Notice } from '../ui/Notice';
import { DocSync } from './sync';

export interface Syncs {
  plan: DocSync<PlanDoc>;
  people: DocSync<People>;
  checks: DocSync<ChecksDoc>;
}

const DataContext = createContext<Syncs | null>(null);

/** 숨기면 바로 저장, 다시 보면 다른 기기 변경을 받기, 다시 로그인하면 못 한 저장 마저 하기 */
function useSyncLifecycle(syncs: Syncs | null) {
  useEffect(() => {
    if (!syncs) return;
    const all = [syncs.plan, syncs.people, syncs.checks] as DocSync<unknown>[];
    const flush = () => all.forEach((s) => s.flushNow());
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') { flush(); return; }
      docs.all().then((d) => {
        syncs.plan.adopt(d.plan);
        syncs.people.adopt(d.people);
        syncs.checks.adopt(d.checks);
      }).catch(() => undefined);
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (all.some((s) => s.get().state !== 'saved' && s.get().state !== 'conflict')) { flush(); e.preventDefault(); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onLeave);
    window.addEventListener(LOGGED_IN, flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onLeave);
      window.removeEventListener(LOGGED_IN, flush);
    };
  }, [syncs]);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [syncs, setSyncs] = useState<Syncs | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    docs.all()
      .then((d) => setSyncs({
        plan: new DocSync('plan', d.plan, normalizePlan),
        people: new DocSync('people', d.people, normalizePeople),
        checks: new DocSync('checks', d.checks, normalizeChecks),
      }))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(load, [load]);
  useSyncLifecycle(syncs);

  if (error) return <Notice title="저장된 숫자를 못 불러왔어요" text={error} action="다시 불러오기" onAction={load} />;
  if (!syncs) return <Notice title="불러오는 중…" text="무료 서버라 잠들어 있었다면 1분쯤 걸려요." />;
  return <DataContext.Provider value={syncs}>{children}</DataContext.Provider>;
}

export function useSyncs(): Syncs {
  const value = useContext(DataContext);
  if (!value) throw new Error('DataProvider 안에서만 쓸 수 있어요');
  return value;
}
