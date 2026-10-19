// 로그인 뒤 문서(계획·사람·할 일·대출 기록)를 한 번 읽어 와서 화면 전체에 나눠 준다.
// 새 문서는 NORMALIZE에 한 줄 더하고, 백엔드 DOC_KEYS에도 넣는다.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { LOGGED_IN } from '../api/client';
import { docs, type DocKey, type DocOut } from '../api/endpoints';
import { normalizeChecks } from '../domain/checks';
import { normalizeLoans } from '../domain/loanlog';
import { normalizePeople } from '../domain/people';
import { normalizePlan } from '../domain/plan';
import { Notice } from '../ui/Notice';
import { DocSync } from './sync';

const NORMALIZE = { plan: normalizePlan, people: normalizePeople, checks: normalizeChecks, loans: normalizeLoans } satisfies Record<DocKey, (raw: unknown) => unknown>;
const KEYS = Object.keys(NORMALIZE) as DocKey[];

export type Syncs = { [K in DocKey]: DocSync<ReturnType<(typeof NORMALIZE)[K]>> };

const DataContext = createContext<Syncs | null>(null);

function makeSyncs(d: Partial<Record<DocKey, DocOut>>): Syncs {
  const out: Partial<Record<DocKey, DocSync<unknown>>> = {};
  for (const k of KEYS) out[k] = new DocSync<unknown>(k, d[k], NORMALIZE[k]);
  return out as Syncs;
}

const each = (syncs: Syncs) => KEYS.map((k) => syncs[k] as DocSync<unknown>);

/** 숨기면 바로 저장, 다시 보면 다른 기기 변경을 받기, 다시 로그인하면 못 한 저장 마저 하기 */
function useSyncLifecycle(syncs: Syncs | null) {
  useEffect(() => {
    if (!syncs) return;
    const all = each(syncs);
    const flush = () => all.forEach((s) => s.flushNow());
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') { flush(); return; }
      docs.all().then((d) => KEYS.forEach((k) => (syncs[k] as DocSync<unknown>).adopt(d[k]))).catch(() => undefined);
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
    docs.all().then((d) => setSyncs(makeSyncs(d))).catch((err: Error) => setError(err.message));
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
