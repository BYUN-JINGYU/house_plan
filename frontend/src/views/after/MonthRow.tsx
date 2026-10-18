// 월 실수령이 어디로 가는지 한 줄 막대 (생활비 / 관리비·재산세 / 대출 / 남는 돈)
import { won } from '../../domain/format';
import { StackBar } from '../../ui/StackBar';

interface Groups { income: number; living: number; house: number; debt: number; left: number }

export function MonthRow({ title, g }: { title: string; g: Groups }) {
  const parts = [
    { key: 'living', label: '생활비', v: g.living, cls: 's1' },
    { key: 'house', label: '관리비·재산세', v: g.house, cls: 's2' },
    { key: 'debt', label: '대출 갚는 돈', v: g.debt, cls: 's3' },
    { key: 'left', label: '남는 돈', v: Math.max(0, g.left), cls: 's4' },
  ].map((p) => ({ ...p, text: won(p.v) }));
  return (
    <div className="mrow">
      <p className="mhead">
        <span>{title}</span>
        <strong className={g.left < 0 ? 'bad' : ''}>남는 돈 {won(g.left)}</strong>
      </p>
      <StackBar parts={parts} whole={Math.max(g.income, g.living + g.house + g.debt)} label={title} />
      <p className="mdetail">생활비 {won(g.living)} · 관리비·재산세 {won(g.house)} · 대출 {won(g.debt)}</p>
    </div>
  );
}
