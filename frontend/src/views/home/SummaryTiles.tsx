// 잔금 이후 숫자 세 개: 매달 남는 돈, 금고 만기 때 남는 대출, 금고 다 갚는 달 (만기·다 갚는 달은 달마다 대출표 기준: 적은 상환 반영)
import { compactWon, won } from '../../domain/format';
import type { LoanSummary } from '../../domain/loans';
import type { Scenario } from '../../domain/scenario';
import { monthlyGroups, type Outlook } from '../../domain/yearly';
import { Stat } from '../../ui/bits';

function bonusText(need: number | null): string {
  if (need == null) return '특별성과급으로도 못 갚아요';
  if (need === 0) return '특별성과급 없이 다 갚아요';
  return `특별성과급 ${compactWon(need)}이면 0`;
}

export function SummaryTiles({ s, o, sum }: { s: Scenario; o: Outlook; sum: LoanSummary }) {
  const now = monthlyGroups(s, o.rows[0]);
  const later = monthlyGroups(s, o.afterGrace);
  const graceYear = s.closeYear + Math.round(s.coGrace);
  const termYear = s.closeYear + Math.round(s.ggTerm);
  const [py, pm] = (sum.ggPaidOff ?? '').split('-').map(Number);
  return (
    <div className="stats">
      <Stat label="잔금 후 매달 남는 돈" value={won(now.left)} tone={now.left < 0 ? 'bad' : ''}
        sub={<span className={later.left < 0 ? 'bad' : ''}>{graceYear}년 {s.closeMonth}월부터 {won(later.left)}</span>} />
      <Stat label="금고 만기 때 남는 대출" value={won(sum.atMaturity)} tone={sum.atMaturity > 0.5 ? 'bad' : 'good'}
        sub={<><span className="line">{termYear}년 {s.closeMonth}월 만기</span><span className="line">{bonusText(o.bonusNeeded)}</span></>} />
      <Stat label="금고 다 갚는 달" value={sum.ggPaidOff ? `${py}년 ${pm}월` : '13년 넘게'}
        sub={sum.ggPaidOff ? '계획대로 갚으면 (적은 상환 반영)' : '가정을 바꿔 보세요'} />
    </div>
  );
}
