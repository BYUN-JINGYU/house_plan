// 탭 목록: 한눈에 → 자산 → 구매 전 → 구입일 → 구매 후 → 가계부 → 할 일 → 가정.
// 주소 뒤 #home 같은 해시로 마지막 화면을 기억한다. 예전 주소(#summary, #a, #b)도 받는다.
import type { IconName } from '../ui/Icon';

export type TabId = 'home' | 'assets' | 'before' | 'closing' | 'after' | 'ledger' | 'todo' | 'assume';

export const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'home', label: '한눈에', icon: 'home' },
  { id: 'assets', label: '자산', icon: 'wallet' },
  { id: 'before', label: '구매 전', icon: 'seed' },
  { id: 'closing', label: '구입일', icon: 'key' },
  { id: 'after', label: '구매 후', icon: 'house' },
  { id: 'ledger', label: '가계부', icon: 'book' },
  { id: 'todo', label: '할 일', icon: 'check' },
  { id: 'assume', label: '가정', icon: 'sliders' },
];

const OLD: Record<string, TabId> = { summary: 'home', a: 'assets', b: 'assets' };

export function tabFromHash(hash: string): TabId {
  const id = hash.replace(/^#/, '');
  return TABS.find((t) => t.id === id)?.id ?? OLD[id] ?? 'home';
}
