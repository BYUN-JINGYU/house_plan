// 할 일: 날짜(계획 + 내가 넣은 일정) | 확인할 것, 참고 링크
import { removeFrom } from '../domain/edit';
import { timeline } from '../domain/timeline';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { AddEvent } from './todo/AddEvent';
import { Checklist } from './todo/Checklist';
import { Links } from './todo/Links';

export function TodoView() {
  const { model } = useModel();
  const syncs = useSyncs();
  const [checks, setChecks] = useDocSync(syncs.checks);
  const [plan, setPlan] = useDocSync(syncs.plan);
  const items = timeline(model.s, model.c, model.o, plan.events);
  return (
    <div className="split even">
      <section className="col">
        <h2>날짜</h2>
        <ol className="timeline">
          {items.map((x) => (
            <li key={`${x.when}-${x.what}`} className={`${x.key ? 'pin' : ''} ${x.past ? 'past' : ''}`}>
              <span className="when">{x.when}</span>
              <span className="what">
                {x.past && <span className="done-mark" aria-label="지남">✓</span>}
                {x.what}
                {x.eventId && (
                  <button type="button" className="icon-btn" aria-label={`${x.what} 지우기`}
                    onClick={() => setPlan({ ...plan, events: removeFrom(plan.events, x.eventId!) })}>×</button>
                )}
              </span>
            </li>
          ))}
        </ol>
        <AddEvent onAdd={(e) => setPlan({ ...plan, events: [...plan.events, e] })} />
      </section>
      <section className="col">
        <Checklist items={checks.items} onChange={(next) => setChecks({ ...checks, items: next })} />
        <Links links={checks.links} onChange={(next) => setChecks({ ...checks, links: next })} />
      </section>
    </div>
  );
}
