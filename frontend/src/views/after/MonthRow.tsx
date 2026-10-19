// 월 실수령이 어디로 가는지 한 줄 막대 (생활비 / 관리비·재산세 / 대출 / 남는 돈)
import { won } from '../../domain/format';
import { StackBar } from '../../ui/StackBar';

interface Groups { income: number; living: number; house: number; debt: number; left: number }

interface Props { title: string; sub: string; g: Groups }

export function MonthRow({ title, sub, g }: Props) {
  const parts = [
    { key: 'living', label: '생활비', v: g.living, cls: 's1' },
    { key: 'house', label: '관리비·재산세', v: g.house, cls: 's2' },
    { key: 'debt', label: '대출 갚는 돈', v: g.debt, cls: 's3' },
    { key: 'left', label: '남는 돈', v: Math.max(0, g.left), cls: 's4' },
  ].map((p) => ({ ...p, text: won(p.v) }));
  return (
    <div className="mrow">
      <div className="mhead">
        <p className="mtitle">{title}<small>{sub}</small></p>
        <p className={`mleft ${g.left < 0 ? 'bad' : ''}`}>
          {g.left > 0 && <span className="sw s4" aria-hidden="true" />}
          남는 돈 {won(g.left)}
        </p>
      </div>
      <StackBar parts={parts} whole={Math.max(g.income, g.living + g.house + g.debt)} label={`${title}, ${sub}`} />
      <p className="mdetail">
        {parts.slice(0, 3).map((p) => (
          <span key={p.key}><span className={`sw ${p.cls}`} aria-hidden="true" />{p.label} {p.text}</span>
        ))}
      </p>
    </div>
  );
}
