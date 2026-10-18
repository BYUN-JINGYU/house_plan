// 가정 한 칸: 이름·설명, 입력, 바꿨으면 되돌리기
import { labelFor, type FieldDef } from '../../domain/fields';
import type { Names } from '../../domain/plan';
import { DateInput, NumberInput } from '../../ui/inputs';

interface Props {
  f: FieldDef;
  value: number | string;
  names: Names;
  changed: boolean;
  onValue: (v: number | string) => void;
  onReset: () => void;
}

export function FieldRow({ f, value, names, changed, onValue, onReset }: Props) {
  const id = `f-${f.key}`;
  const label = labelFor(f.label, names);
  return (
    <div className={`fld-line${changed ? ' changed' : ''}`}>
      <label htmlFor={id} className="lab">
        {label}
        {f.note && <small>{f.note}</small>}
      </label>
      {f.kind === 'date'
        ? <DateInput id={id} value={String(value)} onValue={onValue} />
        : <NumberInput id={id} kind={f.kind} value={Number(value)} onValue={onValue} placeholder="0" />}
      {changed
        ? <button type="button" className="icon-btn" title="처음 값으로" aria-label={`${label} 처음 값으로`} onClick={onReset}>↺</button>
        : <span className="icon-gap" aria-hidden="true" />}
    </div>
  );
}
