// 문서 하나를 화면과 서버 사이에서 맞춘다.
// 바꾸면 잠깐 뒤 저장하고, 다른 기기가 먼저 저장했으면(버전 충돌) 서버 값으로 바꾼 뒤 멈춘다.
import { useSyncExternalStore } from 'react';
import { ApiError } from '../api/client';
import { docs, type DocKey, type DocOut } from '../api/endpoints';
import { stable } from './stable';

export type SaveState = 'saved' | 'pending' | 'saving' | 'error' | 'conflict';

export interface SyncSnapshot<T> {
  value: T;
  state: SaveState;
  savedAt: string | null;
  stored: boolean;
}

const outcomeUnknown = (err: unknown) => !(err instanceof ApiError) || err.status === 0 || err.status >= 500;

export class DocSync<T> {
  private snap: SyncSnapshot<T>;
  private version: number;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private inFlight = false;
  private again = false;
  /** 보냈지만 저장됐는지 모르는 값 (응답을 못 받았을 때) */
  private unconfirmed: string | null = null;
  private listeners = new Set<() => void>();

  constructor(
    private readonly key: DocKey,
    initial: DocOut | undefined,
    private readonly normalize: (raw: unknown) => T,
    private readonly delay = 700,
  ) {
    this.version = initial?.version ?? 0;
    this.snap = { value: normalize(initial?.data), state: 'saved', savedAt: initial?.updatedAt ?? null, stored: Boolean(initial) };
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };

  get = () => this.snap;

  set = (value: T) => {
    this.update({ value, state: 'pending' });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.delay);
  };

  /** 기다리지 않고 바로 저장 (창을 숨길 때, 다시 시도할 때, 다시 로그인했을 때) */
  flushNow = () => {
    clearTimeout(this.timer);
    if (this.snap.state === 'pending' || this.snap.state === 'error') void this.flush();
  };

  /** 다른 기기에서 저장한 더 새 문서를 받는다 (이 기기에서 고치는 중이 아닐 때만) */
  adopt = (out: DocOut | undefined) => {
    if (!out || out.version <= this.version) return;
    if (this.snap.state !== 'saved' && this.snap.state !== 'conflict') return;
    this.version = out.version;
    this.update({ value: this.normalize(out.data), state: 'saved', savedAt: out.updatedAt, stored: true });
  };

  private update(patch: Partial<SyncSnapshot<T>>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  private async flush(): Promise<void> {
    if (this.inFlight) { this.again = true; return; }
    this.inFlight = true;
    const value = this.snap.value;
    const sent = stable(value);
    this.update({ state: 'saving' });
    try {
      this.accept(await docs.put(this.key, value, this.version), sent);
    } catch (err) {
      this.fail(err, sent);
    } finally {
      this.inFlight = false;
      if (this.again) { this.again = false; void this.flush(); }
    }
  }

  /** 서버에 있는 값(saved)을 기준으로 버전을 맞추고, 그 뒤에 또 고쳤으면 이어서 저장 */
  private accept(out: DocOut, saved: string) {
    this.unconfirmed = null;
    this.version = out.version;
    const changed = stable(this.snap.value) !== saved;
    this.update({ state: changed ? 'pending' : 'saved', savedAt: out.updatedAt, stored: true });
    if (changed) this.again = true;
  }

  private fail(err: unknown, sent: string) {
    if (!(err instanceof ApiError && err.status === 409)) {
      if (outcomeUnknown(err)) this.unconfirmed = sent;
      this.update({ state: 'error' });
      return;
    }
    clearTimeout(this.timer);
    const current = (err.body as { detail?: { current?: DocOut | null } } | null)?.detail?.current ?? null;
    const theirs = current ? stable(current.data) : null;
    if (current && theirs !== null && (theirs === sent || theirs === this.unconfirmed)) {
      this.accept(current, theirs); // 우리가 보낸 값이 이미 저장돼 있었다
      return;
    }
    this.unconfirmed = null;
    this.again = false;
    this.version = current?.version ?? 0;
    this.update({ value: this.normalize(current?.data), state: 'conflict', savedAt: current?.updatedAt ?? null, stored: Boolean(current) });
  }
}

export function useDocSync<T>(sync: DocSync<T>): [T, (v: T) => void, SyncSnapshot<T>] {
  const snap = useSyncExternalStore(sync.subscribe, sync.get);
  return [snap.value, sync.set, snap];
}
