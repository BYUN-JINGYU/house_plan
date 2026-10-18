// 자동 저장: 정상 저장, 버전 충돌, 응답을 못 받은 저장, 다른 기기 값 받기
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';

const put = vi.fn();
vi.mock('../api/endpoints', () => ({ docs: { put: (...args: unknown[]) => put(...args) } }));

const { DocSync } = await import('./sync');

type Doc = { title: string };
const norm = (raw: unknown) => ({ title: (raw as Doc | undefined)?.title ?? '' });
const out = (title: string, version: number) => ({ data: { title }, version, updatedAt: '2026-10-19T00:00:00Z' });
const conflict = (title: string, version: number) =>
  new ApiError(409, 'conflict', { detail: { message: 'x', current: out(title, version) } });

async function settle() {
  await vi.advanceTimersByTimeAsync(1000);
}

describe('DocSync', () => {
  beforeEach(() => { vi.useFakeTimers(); put.mockReset(); });
  afterEach(() => vi.useRealTimers());

  it('고치면 잠깐 뒤 저장하고 버전을 올린다', async () => {
    put.mockResolvedValueOnce(out('a', 1)).mockResolvedValueOnce(out('b', 2));
    const sync = new DocSync<Doc>('plan', undefined, norm);
    sync.set({ title: 'a' });
    await settle();
    sync.set({ title: 'b' });
    await settle();
    expect(put.mock.calls.map((c) => c[2])).toEqual([0, 1]);
    expect(sync.get().state).toBe('saved');
  });

  it('다른 기기가 먼저 저장했으면 서버 값으로 바꾸고 다시 보내지 않는다', async () => {
    put.mockRejectedValueOnce(conflict('other', 5));
    const sync = new DocSync<Doc>('plan', out('old', 4), norm);
    sync.set({ title: 'mine' });
    await settle();
    await settle();
    expect(put).toHaveBeenCalledTimes(1);
    expect(sync.get()).toMatchObject({ state: 'conflict', value: { title: 'other' } });
  });

  it('저장은 됐는데 응답을 못 받았으면, 다음 충돌 때 버전만 맞추고 새 값을 보낸다', async () => {
    put
      .mockRejectedValueOnce(new ApiError(0, 'network', null))
      .mockRejectedValueOnce(conflict('first', 2))
      .mockResolvedValueOnce(out('second', 3));
    const sync = new DocSync<Doc>('plan', out('zero', 1), norm);
    sync.set({ title: 'first' });
    await settle();
    expect(sync.get().state).toBe('error');
    sync.set({ title: 'second' });
    await settle();
    await settle();
    expect(put.mock.calls.map((c) => [c[1], c[2]])).toEqual([[{ title: 'first' }, 1], [{ title: 'second' }, 1], [{ title: 'second' }, 2]]);
    expect(sync.get()).toMatchObject({ state: 'saved', value: { title: 'second' } });
  });

  it('고치는 중이 아니면 더 새 문서를 받는다', () => {
    const sync = new DocSync<Doc>('plan', out('old', 1), norm);
    sync.adopt(out('new', 2));
    expect(sync.get().value.title).toBe('new');
    sync.set({ title: 'typing' });
    sync.adopt(out('newer', 3));
    expect(sync.get().value.title).toBe('typing');
  });
});
