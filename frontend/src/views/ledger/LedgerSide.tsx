// 가계부 옆: 생활비 평균 → 생활비 가정에 쓰기, 분류별 지출, 최근 달 수입·지출
import { won, wonFull } from '../../domain/format';
import { averageLiving, categoryTotals, monthTotals, type LedgerEntry, type Month } from '../../domain/ledger';
import { Card, HBars } from '../../ui/bits';
import { MonthBars } from './MonthBars';

interface Props {
  entries: LedgerEntry[];
  months: Month[];
  month: Month;
  living: number;
  onUseLiving: (v: number) => void;
}

export function LedgerSide({ entries, months, month, living, onUseLiving }: Props) {
  const cats = categoryTotals(entries, month);
  const avg = averageLiving(entries, months);
  const avgMan = Math.round(avg.avg / 10000);
  return (
    <>
      <Card title="생활비 평균" value={avg.count ? `${won(avgMan)} / 월` : undefined}>
        {avg.count ? (
          <>
            <p className="sub">기록 있는 {avg.count}달 평균이에요.</p>
            <p className="sub">지금 가정은 {won(living)}이에요.</p>
            <div className="card-foot">
              <button type="button" className="btn ghost" disabled={avgMan === Math.round(living)} onClick={() => onUseLiving(avgMan)}>
                생활비 가정을 {won(avgMan)}으로 바꾸기
              </button>
            </div>
            <p className="hint">주거·관리비와 대출 상환은 빼고 계산해요.</p>
          </>
        ) : <p className="hint">지출을 적으면 평균을 내서 생활비 가정에 쓸 수 있어요.</p>}
      </Card>
      <Card title="분류별 지출">
        {cats.length
          ? <HBars label="분류별 지출" items={cats.map((c) => ({ label: c.category, v: c.amount, text: wonFull(c.amount) }))} />
          : <p className="hint">지출을 적으면 여기에 모여요.</p>}
      </Card>
      <Card title={`최근 ${months.length}달`}>
        <ul className="legend"><li className="s1"><span className="key" />수입</li><li className="s2"><span className="key" />지출</li></ul>
        <MonthBars rows={monthTotals(entries, months)} />
      </Card>
    </>
  );
}
