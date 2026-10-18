// 잔금에 필요한 전체 돈을 무엇으로 채우는지: 쌓인 막대 하나 + 범례
import { funding, type Closing } from '../../domain/closing';
import { compactWon, won } from '../../domain/format';
import type { Scenario } from '../../domain/scenario';
import { Chips, type Chip } from '../../ui/bits';
import { StackBar } from '../../ui/StackBar';

const CLS = { co: 's1', gg: 's2', save: 's3', have: 's4' } as const;

export function FundingBar({ s, c }: { s: Scenario; c: Closing }) {
  const f = funding(s, c);
  const parts = f.parts.map((p) => ({ ...p, cls: CLS[p.key], text: won(p.v) }));
  const noAssets = c.have <= 0;
  const chips: Chip[] = parts.map((p) => ({
    cls: p.cls, label: p.label, value: p.key === 'have' && noAssets && p.v < 0.5 ? '입력 전' : compactWon(p.v),
  }));
  if (f.short > 0.5) {
    chips.push({ cls: 'short', label: noAssets ? '자산으로 채울 몫' : '부족', value: compactWon(f.short), tone: noAssets ? '' : 'bad' });
  }
  return (
    <section className="block" aria-labelledby="fund-title">
      <h2 id="fund-title">집값 + 부대비용 + 비상금 = {won(f.whole)}</h2>
      <StackBar parts={parts} whole={f.whole} label="잔금에 필요한 돈을 채우는 방법"
        short={{ v: f.short, text: won(f.short), label: noAssets ? '자산으로 채울 몫' : '부족' }} />
      <Chips items={chips} />
    </section>
  );
}
