// 자산 탭에서 마지막으로 본 사람과 항목. 다른 탭에 갔다 와도 그대로 보이게 기억한다.
import type { PersonKey } from '../../domain/people';
import type { TabDef } from '../../ui/Tabs';

export type Section = 'bank' | 'bonus' | 'pay' | 'stocks' | 'retire';

export const SECTIONS: TabDef<Section>[] = [
  { id: 'bank', label: '은행' },
  { id: 'bonus', label: '성과급' },
  { id: 'pay', label: '월급' },
  { id: 'stocks', label: '증권' },
  { id: 'retire', label: '퇴직금' },
];

export interface Pick { person: PersonKey; section: Section }

/** 예전 주소 #b로 들어오면 둘째 사람부터 */
const last: Pick = { person: typeof location !== 'undefined' && location.hash === '#b' ? 'b' : 'a', section: 'bank' };

export const lastPick = (): Pick => ({ ...last });
export const rememberPick = (p: Partial<Pick>) => { Object.assign(last, p); };
