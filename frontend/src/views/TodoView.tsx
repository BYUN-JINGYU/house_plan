// 할 일: 날짜(계획 + 내가 넣은 일정) | 확인할 것, 참고 링크
import { removeFrom } from '../domain/edit';
import { timeline } from '../domain/timeline';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { Card, PageHead } from '../ui/bits';
import { AddEvent } from './todo/AddEvent';
import { Checklist } from './todo/Checklist';
import { Links } from './todo/Links';
import { Timeline } from './todo/Timeline';

export function TodoView() {
  const { model } = useModel();
  const syncs = useSyncs();
  const [checks, setChecks] = useDocSync(syncs.checks);
  const [plan, setPlan] = useDocSync(syncs.plan);
  const items = timeline(model.s, model.c, model.o, plan.events);
  const left = checks.items.filter((x) => !x.done).length;
  return (
    <div className="page">
      <PageHead title="할 일" sub={`확인할 것이 ${left}개 남았어요.`} />
      <div className="grid even">
        <Card title="날짜">
          <Timeline items={items} onRemove={(id) => setPlan({ ...plan, events: removeFrom(plan.events, id) })} />
          <AddEvent onAdd={(e) => setPlan({ ...plan, events: [...plan.events, e] })} />
        </Card>
        <div className="col">
          <Card title="확인할 것" value={`${left}개 남음`}>
            <Checklist items={checks.items} onChange={(next) => setChecks({ ...checks, items: next })} />
          </Card>
          <Card title="참고 링크">
            <Links links={checks.links} onChange={(next) => setChecks({ ...checks, links: next })} />
          </Card>
        </div>
      </div>
    </div>
  );
}
