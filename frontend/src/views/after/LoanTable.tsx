// 달마다 대출표: 해마다 접어 두고(올해는 펼침). 달마다 낼 돈, 금고 상환(비우면 계획), '냄' 도장
import { won } from '../../domain/format';
import type { LoanRow } from '../../domain/loans';
import { Card } from '../../ui/bits';
import { NumberInput } from '../../ui/inputs';
import { Num } from '../../ui/Num';
import { Stamp } from '../../ui/Stamp';

interface Props {
  rows: LoanRow[]; today: string;
  onRepay: (month: string, value: number | undefined) => void;
  onPaid: (month: string, paid: boolean) => void;
}

const mm = (month: string) => `${Number(month.slice(5))}월`;

/** 빈칸으로 지우면: 계획 상환이 있던 달은 '안 갚음'(0), 없던 달은 기록을 지운다 */
const repayValue = (r: LoanRow, v: number) => (v > 0 ? v : r.ggPlan > 0 ? 0 : undefined);

export function LoanTable({ rows, today, onRepay, onPaid }: Props) {
  const years = [...new Set(rows.map((r) => r.month.slice(0, 4)))];
  const open = years.includes(today.slice(0, 4)) ? today.slice(0, 4) : years[0];
  const now = today.slice(0, 7);
  return (
    <Card title="달마다 대출">
      <p className="note">금고 상환을 비워 두면 계획대로 계산해요.</p>
      {years.map((y) => {
        const list = rows.filter((r) => r.month.startsWith(y));
        const last = list[list.length - 1];
        const total = list.reduce((sum, r) => sum + r.due + r.ggRepay, 0);
        const paid = list.filter((r) => r.paid).length;
        return (
          <details key={y} className="loan-year" open={y === open}>
            <summary>
              <span className="ly-year">{y}년</span>
              <span className="ly-sum">낼 돈 <Num text={won(total)} /></span>
              <span className="ly-bal">연말 잔액 사내 {won(last.coBal)}, 금고 {won(last.ggBal)}</span>
              {paid > 0 && <span className="ly-paid">{paid}달 냄</span>}
            </summary>
            <div className="table-wrap">
              <table className="loan-table">
                <thead>
                  <tr><th scope="col">달</th><th scope="col">사내대출</th><th scope="col">금고 이자</th><th scope="col">세금</th><th scope="col">합계</th><th scope="col">금고 상환</th><th scope="col">냄</th></tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.month} className={[r.maturity && 'maturity', r.month === now && 'now', r.paid && 'paid'].filter(Boolean).join(' ')}>
                      <th scope="row">{mm(r.month)}{r.maturity && <small>금고 만기</small>}</th>
                      <td>{won(r.coInt + r.coPrin)}</td>
                      <td>{won(r.ggInt)}</td>
                      <td>{won(r.lowTax)}</td>
                      <td className="sum">{won(r.due)}</td>
                      <td className="repay">
                        <NumberInput kind="won" aria-label={`${y}년 ${mm(r.month)} 금고 상환 (만원)`}
                          placeholder={r.entered ? '안 갚음' : r.ggPlan > 0 ? `계획 ${won(r.ggPlan)}` : ''}
                          value={r.entered ? r.ggRepay : 0} onValue={(v) => onRepay(r.month, repayValue(r, v))} />
                        {r.entered && <button type="button" className="icon-btn" aria-label="계획대로" title="계획대로" onClick={() => onRepay(r.month, undefined)}>↺</button>}
                      </td>
                      <td><Stamp paid={r.paid} label={`${y}년 ${mm(r.month)}`} onToggle={() => onPaid(r.month, !r.paid)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
    </Card>
  );
}
