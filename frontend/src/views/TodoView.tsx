// 할 일: 확인할 것(묶음별로 나란히, 단계별 묶음 더하기) / 날짜 | 참고 링크 / 앞으로 12달 돈 일정
import { upcoming } from '../domain/bills';
import { removeFrom } from '../domain/edit';
import { timeline } from '../domain/timeline';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { Card, PageHead } from '../ui/bits';
import { AddEvent } from './todo/AddEvent';
import { BillsCard } from './todo/BillsCard';
import { Checklist } from './todo/Checklist';
import { Links } from './todo/Links';
import { Timeline } from './todo/Timeline';

export function TodoView() {
  const { model } = useModel();
  const syncs = useSyncs();
  const [checks, setChecks] = useDocSync(syncs.checks);
  const [plan, setPlan] = useDocSync(syncs.plan);
  const items = timeline(model.s, model.c, model.o, plan.events, model.loanSum.atMaturity);
  const left = checks.items.filter((x) => !x.done).length;
  return (
    <div className="page">
      <PageHead title="할 일" sub={`확인할 것이 ${left}개 남았어요.`} />
      <Card title="확인할 것" value={`${left}개 남음`}>
        <Checklist items={checks.items} onChange={(next) => setChecks({ ...checks, items: next })} />
      </Card>
      <div className="grid even">
        <Card title="날짜">
          <Timeline items={items} onRemove={(id) => setPlan({ ...plan, events: removeFrom(plan.events, id) })} />
          <AddEvent onAdd={(e) => setPlan({ ...plan, events: [...plan.events, e] })} />
        </Card>
        <Card title="참고 링크">
          <Links links={checks.links} onChange={(next) => setChecks({ ...checks, links: next })} />
        </Card>
      </div>
      <BillsCard months={upcoming(model, 12)} />
    </div>
  );
}
