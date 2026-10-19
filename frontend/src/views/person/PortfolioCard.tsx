// 증권 구성: 종목별 평가액 막대(값과 비중을 같이), 한 종목 쏠림, 해외주식을 두 해에 나눠 팔 때 양도세
import { pct, won } from '../../domain/format';
import type { Portfolio } from '../../domain/portfolio';
import { Card, HBars } from '../../ui/bits';

export function PortfolioCard({ p }: { p: Portfolio }) {
  if (!p.slices.length) return null;
  return (
    <Card title="구성" value={p.usShare > 0 ? `미국 ${pct(p.usShare, 0)}` : undefined}>
      <HBars label="종목별 평가액" items={p.slices.map((x) => ({ id: x.id, label: x.label, note: pct(x.share, 0), v: x.value, text: won(x.value) }))} />
      {p.top && p.slices.length > 1 && p.top.share >= 0.4 && (
        <p className="note">가장 큰 종목({p.top.label})이 {pct(p.top.share, 0)}예요. 그 주가가 10% 움직이면 {won(p.top.value * 0.1)} 바뀌어요.</p>
      )}
      {p.saving >= 1 && (
        <p className="note">해외주식을 올해 다 팔면 양도세 {won(p.taxAll)}, 두 해에 반씩 팔면 {won(p.taxSplit)}이에요.</p>
      )}
    </Card>
  );
}
