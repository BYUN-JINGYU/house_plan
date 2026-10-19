// 가정: 이름·제목·환율, 백업 | 항목 묶음(접어 두고 필요한 것만 펼친다)
import { DEFAULTS } from '../domain/assumptions';
import { clearOverride, setOverride } from '../domain/edit';
import { FIELD_GROUPS } from '../domain/fields';
import type { PlanDoc } from '../domain/plan';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { Badge, Card, PageHead } from '../ui/bits';
import { ConfirmButton } from '../ui/ConfirmButton';
import { TextInput } from '../ui/inputs';
import { BackupCard } from './assume/BackupCard';
import { FieldRow } from './assume/FieldRow';

const changed = (plan: PlanDoc, key: keyof typeof DEFAULTS) => key in plan.overrides && plan.overrides[key] !== DEFAULTS[key];

export function AssumeView({ onLogout }: { onLogout: () => void }) {
  const [plan, setPlan] = useDocSync(useSyncs().plan);
  const { model } = useModel();
  const setName = (key: 'a' | 'b', v: string) => setPlan({ ...plan, names: { ...plan.names, [key]: v } });
  return (
    <div className="page">
      <PageHead title="가정" sub="숫자를 바꾸면 모든 화면이 바로 다시 계산돼요." />
      <div className="grid even">
        <Card title="이름과 제목">
          <div className="pair">
            <label className="fld">첫째 사람<TextInput maxLength={8} value={plan.names.a} onValue={(v) => setName('a', v)} /></label>
            <label className="fld">둘째 사람<TextInput maxLength={8} value={plan.names.b} onValue={(v) => setName('b', v)} /></label>
          </div>
          <label className="fld gap-y">제목<TextInput maxLength={30} value={plan.title} onValue={(title) => setPlan({ ...plan, title })} /></label>
          <label className="check-line">
            <input type="checkbox" checked={plan.useLiveFx} onChange={(e) => setPlan({ ...plan, useLiveFx: e.target.checked })} />
            실시간 환율 쓰기
          </label>
        </Card>
        <BackupCard />
      </div>
      <div className="groups">
        {FIELD_GROUPS.map((g) => {
          const count = g.fields.filter((f) => changed(plan, f.key)).length;
          return (
            <details key={g.title} className="group">
              <summary>{g.title}{count > 0 && <Badge tone="">{count}개 바꿈</Badge>}</summary>
              <div className="group-body">
                {g.fields.map((f) => (
                  <FieldRow key={f.key} f={f} names={plan.names} value={model.a[f.key]} changed={changed(plan, f.key)}
                    onValue={(v) => setPlan(setOverride(plan, f.key, v))}
                    onReset={() => setPlan(clearOverride(plan, f.key))} />
                ))}
              </div>
            </details>
          );
        })}
      </div>
      <div className="btn-row">
        <ConfirmButton label="가정을 모두 처음 값으로" confirm="한 번 더 누르면 되돌려요" onConfirm={() => setPlan({ ...plan, overrides: {} })} />
        <button type="button" className="btn ghost" onClick={onLogout}>이 기기에서 나가기</button>
      </div>
    </div>
  );
}
