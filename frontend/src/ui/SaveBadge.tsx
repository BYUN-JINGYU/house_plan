// 머리띠의 저장 상태 한 줄: 문서 3개 중 가장 급한 상태를 보여 준다.
import { useSyncs } from '../state/DataProvider';
import { useDocSync, type SaveState } from '../state/sync';

const RANK: SaveState[] = ['error', 'conflict', 'saving', 'pending', 'saved'];
const TEXT: Record<SaveState, string> = {
  error: '저장 못 했어요',
  conflict: '다른 기기에서 바뀐 내용을 불러왔어요',
  saving: '저장하는 중…',
  pending: '바뀐 내용 저장 대기',
  saved: '저장됨',
};

function clock(iso: string): string {
  const at = new Date(iso);
  const time = at.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  const today = at.toDateString() === new Date().toDateString();
  return today ? time : `${at.getMonth() + 1}/${at.getDate()} ${time}`;
}

export function SaveBadge() {
  const syncs = useSyncs();
  const snaps = [useDocSync(syncs.plan)[2], useDocSync(syncs.people)[2], useDocSync(syncs.checks)[2]];
  const state = RANK.find((r) => snaps.some((s) => s.state === r)) ?? 'saved';
  const last = snaps.map((s) => s.savedAt).filter(Boolean).sort().at(-1);
  const retry = () => [syncs.plan, syncs.people, syncs.checks].forEach((s) => s.flushNow());
  return (
    <p className={`save-state ${state}`} aria-live="polite">
      {state === 'saved' && last ? `${clock(last)} 저장됨` : TEXT[state]}
      {state === 'error' && <button type="button" className="linkish" onClick={retry}>다시</button>}
    </p>
  );
}
