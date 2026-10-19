// 한눈에 머리 (통장 표지 색): 잔금 판정 + 구매 전 → 구입일 → 구매 후 세 단계. 단계를 누르면 그 탭으로.
import { won } from '../../domain/format';
import { daysBetween, dateLabel, parseYmd } from '../../domain/schedule';
import type { PlanModel } from '../../domain/compute';
import { Badge } from '../../ui/bits';
import { Num } from '../../ui/Num';
import type { TabId } from '../tabs';
import { verdict } from './verdict';

interface Step { id: TabId; title: string; when: string; lines: string[] }

function steps(m: PlanModel): Step[] {
  const { s, c, flow, loanSum } = m;
  const days = daysBetween(s.asOf, s.closingDate);
  const next = flow.flatMap((r) => r.items).find((x) => x.label !== '월급' && x.label !== '생활비' && x.date > s.asOf);
  const end = parseYmd(s.closingDate);
  const due = `${end.y + Math.round(s.ggTerm)}년 ${end.m}월`;
  return [
    { id: 'before', title: '구매 전', when: days > 0 ? `D-${days}` : '지남',
      lines: [`모을 돈 ${won(c.inflow)}`, next ? `다음: ${dateLabel(next.date)} ${next.label}` : '남은 일정 없음'] },
    { id: 'closing', title: '구입일', when: dateLabel(s.closingDate),
      lines: [`대출 ${won(s.coLoan + c.gg)}`, `부대비용 ${won(c.costSum)}`] },
    { id: 'after', title: '구매 후', when: `금고 만기 ${due}`,
      lines: [`첫 달 대출 ${won(loanSum.first?.due ?? 0)}`, loanSum.atMaturity > 0.5 ? `만기에 남는 금고 ${won(loanSum.atMaturity)}` : '만기 전에 금고를 다 갚아요'] },
  ];
}

export function Hero({ model, go }: { model: PlanModel; go: (tab: TabId) => void }) {
  const { s, c, alt } = model;
  const w = verdict(s, c, alt);
  const now: TabId = s.asOf < s.closingDate ? 'before' : s.asOf === s.closingDate ? 'closing' : 'after';
  return (
    <section className="hero" aria-label="잔금 판정과 단계">
      <p className="hero-when">{dateLabel(s.closingDate)} 잔금 기준</p>
      <div className="hero-main">
        <h1 className="hero-num"><Num text={w.head} /></h1>
        <Badge tone={w.tone}>{w.badge}</Badge>
      </div>
      <p className="hero-sub">{w.sub}</p>
      <ol className="journey">
        {steps(model).map((st) => (
          <li key={st.id} className={st.id === now ? 'now' : ''}>
            <button type="button" onClick={() => go(st.id)} aria-current={st.id === now ? 'step' : undefined}>
              <span className="j-dot" aria-hidden="true" />
              <span className="j-title">{st.title}<small>{st.when}</small></span>
              {st.lines.map((l) => <span key={l} className="j-line">{l}</span>)}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
