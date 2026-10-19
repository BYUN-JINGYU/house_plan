// 구매 후: 이번 달 대출 | 금고 / 달마다 대출표 / 월 실수령은 어디로 | 대출 잔액과 모은 돈
import { monthLabel } from '../domain/ledger';
import { patchMonth, type MonthLog } from '../domain/loanlog';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { PageHead } from '../ui/bits';
import { BalanceCard } from './after/BalanceCard';
import { GgCard } from './after/GgCard';
import { LoanNow } from './after/LoanNow';
import { LoanTable } from './after/LoanTable';
import { WhereCard } from './after/WhereCard';

export function AfterView() {
  const { model } = useModel();
  const [log, setLog] = useDocSync(useSyncs().loans);
  const { s, o, loans, loanSum } = model;
  const row = loanSum.now ?? loans[0];
  const setMonth = (month: string, patch: MonthLog) => setLog(patchMonth(log, month, patch));
  return (
    <div className="page">
      <PageHead title="구매 후" sub="잔금 뒤 달마다 대출을 관리해요." />
      <div className="grid even">
        {row && (
          <LoanNow row={row} title={`${loanSum.now ? '이번 달' : '잔금 뒤 첫 달'} (${monthLabel(row.month)})`}
            onPaid={(paid) => setMonth(row.month, { paid })} />
        )}
        <GgCard rows={loans} sum={loanSum} rates={log.rates} onRates={(rates) => setLog({ ...log, rates })} />
      </div>
      <LoanTable rows={loans} today={s.asOf}
        onRepay={(month, ggRepay) => setMonth(month, { ggRepay })} onPaid={(month, paid) => setMonth(month, { paid })} />
      <div className="grid even">
        <WhereCard s={s} o={o} />
        <BalanceCard s={s} o={o} />
      </div>
    </div>
  );
}
