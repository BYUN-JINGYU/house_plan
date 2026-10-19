// 날짜 목록: 계획 날짜와 내가 넣은 일정. 해마다 같은 달에 묶인 일은 한 줄에 하나씩 보여 준다.
import type { TimelineItem } from '../../domain/timeline';

interface Props { items: TimelineItem[]; onRemove: (eventId: string) => void }

// 묶인 일은 ' · '로 이어져 온다. 잔금(한 묶음 이름)과 내가 적은 글은 그대로 둔다.
const lines = (x: TimelineItem) => (x.key || x.eventId ? [x.what] : x.what.split(' · '));

export function Timeline({ items, onRemove }: Props) {
  return (
    <ol className="list timeline">
      {items.map((x) => {
        const id = x.eventId;
        return (
          <li key={`${x.when}-${x.what}`} className={`${x.key ? 'pin' : ''} ${x.past ? 'past' : ''}`}>
            <span className="when">{x.when}</span>
            <span className="what">
              {x.past && <span className="done-mark" aria-label="지남">✓</span>}
              <span className="what-text">{lines(x).map((t, i) => <span key={i}>{t}</span>)}</span>
              {id && (
                <button type="button" className="icon-btn" aria-label={`${x.what} 지우기`} onClick={() => onRemove(id)}>×</button>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
