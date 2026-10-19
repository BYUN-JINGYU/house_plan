// 사람 탭 안 항목. 두 사람 탭을 오가도 같은 항목을 보이게 마지막 고른 것을 기억한다.
import type { TabDef } from '../../ui/Tabs';

export type Section = 'bank' | 'bonus' | 'pay' | 'stocks' | 'retire';

export const SECTIONS: TabDef<Section>[] = [
  { id: 'bank', label: '은행' },
  { id: 'bonus', label: '성과급' },
  { id: 'pay', label: '월급' },
  { id: 'stocks', label: '증권' },
  { id: 'retire', label: '퇴직금' },
];

let last: Section = 'bank';
export const lastSection = () => last;
export const rememberSection = (s: Section) => { last = s; };
