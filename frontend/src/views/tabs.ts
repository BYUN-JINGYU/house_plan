// 탭 목록. 주소 뒤 #summary 같은 해시로 마지막 화면을 기억한다.
import type { Names } from '../domain/plan';

export type TabId = 'summary' | 'a' | 'b' | 'ledger' | 'closing' | 'after' | 'todo' | 'assume';

export const TAB_IDS: TabId[] = ['summary', 'a', 'b', 'ledger', 'closing', 'after', 'todo', 'assume'];

export function tabList(names: Names) {
  const label: Record<TabId, string> = {
    summary: '요약', a: names.a, b: names.b, ledger: '가계부',
    closing: '잔금', after: '잔금 후', todo: '할 일', assume: '가정',
  };
  return TAB_IDS.map((id) => ({ id, label: label[id] }));
}

export function tabFromHash(hash: string): TabId {
  const id = hash.replace(/^#/, '') as TabId;
  return TAB_IDS.includes(id) ? id : 'summary';
}
