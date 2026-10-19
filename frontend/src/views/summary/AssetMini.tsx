// 요약 옆 '지금 자산': 사람별 합계와 시세 상태. 이름을 누르면 그 사람 탭으로.
import { won } from '../../domain/format';
import type { Household } from '../../domain/people';
import type { Names } from '../../domain/plan';
import type { QuotesState } from '../../state/useQuotes';
import { Card } from '../../ui/bits';

interface Props { hh: Household; names: Names; quotes: QuotesState; go: (tab: 'a' | 'b') => void }

function quoteLine(q: QuotesState): string {
  if (q.status === 'loading') return '시세 받는 중…';
  if (q.status === 'error') return `시세를 못 받았어요: ${q.message}`;
  const days = Object.entries(q.book).filter(([key]) => !key.startsWith('FX:')).map(([, x]) => x.asOf).sort();
  if (!days.length) return '은행과 주식은 사람 탭에서 넣어요.';
  const missing = q.missing.length ? `, ${q.missing.length}종목 못 받음` : '';
  return `주식은 ${days[days.length - 1].slice(5).replace('-', '/')} 시세예요 (지연${missing}).`;
}

export function AssetMini({ hh, names, quotes, go }: Props) {
  const people = [['a', hh.a.liquid], ['b', hh.b.liquid]] as const;
  return (
    <Card title="지금 자산" value={won(hh.have)}>
      <ul className="list asset-list">
        {people.map(([key, v]) => (
          <li key={key}>
            <button type="button" className="linkish" onClick={() => go(key)}>{names[key]}</button>
            <strong>{v > 0 ? won(v) : '입력 전'}</strong>
          </li>
        ))}
        {hh.retireUsed > 0 && <li><span>퇴직금 중간정산</span><strong>{won(hh.retireUsed)}</strong></li>}
      </ul>
      <p className="note">{quoteLine(quotes)}</p>
      {hh.bonus > 0 && <p className="note">특별성과급 {won(hh.bonus)}은 잔금 뒤 금고 갚는 데 써요.</p>}
    </Card>
  );
}
