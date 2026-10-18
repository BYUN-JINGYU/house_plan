// 가정: 이름·제목·환율, 백업 | 항목별 가정 (바꾼 칸은 표시, 칸마다 되돌리기)
import { DEFAULTS } from '../domain/assumptions';
import { clearOverride, setOverride } from '../domain/edit';
import { FIELD_GROUPS } from '../domain/fields';
import { useSyncs } from '../state/DataProvider';
import { useModel } from '../state/ModelProvider';
import { useDocSync } from '../state/sync';
import { ConfirmButton } from '../ui/ConfirmButton';
import { TextInput } from '../ui/inputs';
import { BackupCard } from './assume/BackupCard';
import { FieldRow } from './assume/FieldRow';

export function AssumeView() {
  const [plan, setPlan] = useDocSync(useSyncs().plan);
  const { model } = useModel();
  const setName = (key: 'a' | 'b', v: string) => setPlan({ ...plan, names: { ...plan.names, [key]: v } });
  return (
    <div className="assume">
      <div className="split even">
        <div className="card">
          <h2>이름과 제목</h2>
          <div className="pair">
            <label className="fld"><span>첫째 사람</span><TextInput maxLength={8} value={plan.names.a} onValue={(v) => setName('a', v)} /></label>
            <label className="fld"><span>둘째 사람</span><TextInput maxLength={8} value={plan.names.b} onValue={(v) => setName('b', v)} /></label>
          </div>
          <label className="fld"><span>제목</span><TextInput maxLength={30} value={plan.title} onValue={(title) => setPlan({ ...plan, title })} /></label>
          <label className="check-line">
            <input type="checkbox" checked={plan.useLiveFx} onChange={(e) => setPlan({ ...plan, useLiveFx: e.target.checked })} />
            실시간 환율 쓰기 (못 받으면 아래 가정 값)
          </label>
        </div>
        <BackupCard />
      </div>
      <p className="sub gap-top">숫자를 바꾸면 모든 화면이 다시 계산돼요. 금액은 만원, 비율은 %예요. 바꾼 칸에는 점이 붙어요.</p>
      <div className="groups">
        {FIELD_GROUPS.map((g) => (
          <fieldset key={g.title} className="group">
            <legend>{g.title}</legend>
            {g.fields.map((f) => (
              <FieldRow key={f.key} f={f} names={plan.names} value={model.a[f.key]}
                changed={f.key in plan.overrides && plan.overrides[f.key] !== DEFAULTS[f.key]}
                onValue={(v) => setPlan(setOverride(plan, f.key, v))}
                onReset={() => setPlan(clearOverride(plan, f.key))} />
            ))}
          </fieldset>
        ))}
      </div>
      <div className="gap-top">
        <ConfirmButton label="가정을 모두 처음 값으로" confirm="한 번 더 누르면 되돌려요" onConfirm={() => setPlan({ ...plan, overrides: {} })} />
      </div>
    </div>
  );
}
