// 잔금에 필요한 전체 돈을 무엇으로 채우는지: 굵은 쌓인 막대 하나 + 값이 붙은 범례
import { funding, type Closing } from '../../domain/closing';
import { compactWon, won } from '../../domain/format';
import type { Scenario } from '../../domain/scenario';
import { Card, LegendGrid, More, type LegendItem } from '../../ui/bits';
import { StackBar } from '../../ui/StackBar';

const CLS = { co: 's1', gg: 's2', save: 's3', have: 's4' } as const;

export function FundingBar({ s, c }: { s: Scenario; c: Closing }) {
  const f = funding(s, c);
  const noAssets = c.have <= 0;
  const parts = f.parts.map((p) => ({ ...p, cls: CLS[p.key], text: won(p.v) }));
  const shortLabel = noAssets ? '자산으로 채울 몫' : '부족';
  const items: LegendItem[] = parts.map((p) => ({
    cls: p.cls, label: p.label, value: p.key === 'have' && noAssets && p.v < 0.5 ? '입력 전' : compactWon(p.v),
  }));
  if (f.short > 0.5) items.push({ cls: 'short', label: shortLabel, value: compactWon(f.short), tone: noAssets ? '' : 'bad' });
  return (
    <Card title="잔금에 필요한 돈" value={won(f.whole)} className="fund">
      <StackBar parts={parts} whole={f.whole} label="잔금에 필요한 돈을 채우는 방법"
        short={{ v: f.short, text: won(f.short), label: shortLabel }} />
      <LegendGrid items={items} />
      <More>
        <p>집값 {won(s.price)} + 부대비용 {won(c.costSum)} + 비상금 {won(c.buffer)}</p>
      </More>
    </Card>
  );
}
