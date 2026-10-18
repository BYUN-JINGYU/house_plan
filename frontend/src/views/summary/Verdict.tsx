// 요약 맨 위 판정: 가능 / 얼마 부족 / 얼마 필요 + 도장
import { useEffect, useRef } from 'react';
import type { Closing } from '../../domain/closing';
import { GG_MAX_EACH } from '../../domain/compute';
import { won } from '../../domain/format';
import type { Scenario } from '../../domain/scenario';
import { dateLabel } from '../../domain/schedule';

type Kind = 'ok' | 'short' | null;

function words(s: Scenario, c: Closing, alt: Closing): { head: string; sub: string; kind: Kind } {
  if (c.have <= 0) {
    return { head: `${won(c.reqAll)} 원 필요`, sub: '지금 가진 돈이 이만큼이면 돼요. 사람 탭에 자산을 넣으면 판정해요.', kind: null };
  }
  if (c.gap >= 0) {
    return { head: `${s.closeMonth}월 잔금 가능`, sub: `비상금 ${s.bufferM}개월치를 빼고도 ${won(c.gap)} 남아요.`, kind: 'ok' };
  }
  const max = won(GG_MAX_EACH);
  const sub = alt.gg <= c.gg ? `필요한 돈은 ${won(c.reqAll)}이에요.`
    : alt.gap >= 0 ? `금고를 1인 ${max}으로 늘리면 가능해요.` : `금고를 1인 ${max}으로 늘려도 ${won(-alt.gap)} 부족해요.`;
  return { head: `${won(-c.gap)} 원 부족`, sub, kind: 'short' };
}

export function Verdict({ s, c, alt }: { s: Scenario; c: Closing; alt: Closing }) {
  const { head, sub, kind } = words(s, c, alt);
  const seal = useRef<HTMLDivElement>(null);
  const before = useRef<Kind>(kind);
  useEffect(() => {
    if (before.current === kind || !seal.current) return;
    before.current = kind;
    seal.current.classList.remove('press');
    void seal.current.offsetWidth;
    seal.current.classList.add('press');
  }, [kind]);
  return (
    <div className={`verdict${kind ? ' stamped' : ''}`}>
      <p className="eyebrow">{dateLabel(s.closingDate)} 잔금</p>
      <p className="headline">{head}</p>
      <p className="sub">{sub}</p>
      {kind && (
        <div ref={seal} className="seal" data-kind={kind} aria-hidden="true">
          <span>{kind === 'ok' ? '가능' : '부족'}</span>
        </div>
      )}
    </div>
  );
}
