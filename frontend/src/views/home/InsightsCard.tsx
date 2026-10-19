// 점검할 것: 눈여겨볼 숫자를 한 줄씩. 표시는 모양+글자로도 구분하고(색만으로 구분하지 않게), 누르면 볼 탭으로.
import type { Insight } from '../../domain/insights';
import { Card } from '../../ui/bits';
import { TABS, type TabId } from '../tabs';

const MARK: Record<Insight['tone'], string> = { warn: '!', info: 'i', good: '✓' };
const WORD: Record<Insight['tone'], string> = { warn: '확인', info: '참고', good: '좋은 점' };
const label = (tab: TabId) => TABS.find((t) => t.id === tab)?.label ?? '';

export function InsightsCard({ list, go }: { list: Insight[]; go: (tab: TabId) => void }) {
  if (!list.length) return null;
  return (
    <Card title="점검할 것" value={`${list.length}개`}>
      <ul className="list insights">
        {list.map((x) => (
          <li key={x.id} className={x.tone}>
            <span className="in-mark" role="img" aria-label={WORD[x.tone]}>{MARK[x.tone]}</span>
            <span className="in-text">{x.text}</span>
            <button type="button" className="linkish" onClick={() => go(x.tab)}>{label(x.tab)}</button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
