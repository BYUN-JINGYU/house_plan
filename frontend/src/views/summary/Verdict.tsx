// 요약 맨 위 판정: 큰 숫자 한 줄 + 상태 배지(가능 / 부족 / 판정 전) + 한 줄 설명
import type { Closing } from '../../domain/closing';
import { GG_MAX_EACH } from '../../domain/compute';
import { won } from '../../domain/format';
import type { Scenario } from '../../domain/scenario';
import { dateLabel } from '../../domain/schedule';
import { Badge, type Tone } from '../../ui/bits';

interface Words { head: string; sub: string; tone: Tone; badge: string }

function words(s: Scenario, c: Closing, alt: Closing): Words {
  if (c.have <= 0) {
    return { head: `${won(c.reqAll)} 원 필요`, sub: '사람 탭에 자산을 넣으면 가능한지 알려 줘요.', tone: '', badge: '판정 전' };
  }
  if (c.gap >= 0) {
    return { head: `${won(c.gap)} 원 여유`, sub: `비상금 ${s.bufferM}개월치를 빼고도 남아요.`, tone: 'good', badge: '잔금 가능' };
  }
  const max = won(GG_MAX_EACH);
  const sub = alt.gg <= c.gg ? `필요한 돈은 ${won(c.reqAll)}이에요.`
    : alt.gap >= 0 ? `금고를 1인 ${max}으로 늘리면 가능해요.` : `금고를 1인 ${max}으로 늘려도 ${won(-alt.gap)} 부족해요.`;
  return { head: `${won(-c.gap)} 원 부족`, sub, tone: 'bad', badge: '부족' };
}

export function Verdict({ s, c, alt }: { s: Scenario; c: Closing; alt: Closing }) {
  const w = words(s, c, alt);
  return (
    <section className="hero" aria-live="polite">
      <p className="hero-when">{dateLabel(s.closingDate)} 잔금 기준</p>
      <div className="hero-main">
        <h1 className="hero-num">{w.head}</h1>
        <Badge tone={w.tone}>{w.badge}</Badge>
      </div>
      <p className="hero-sub">{w.sub}</p>
    </section>
  );
}
