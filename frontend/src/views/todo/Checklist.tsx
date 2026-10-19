// 확인할 것: 묶음별 체크(넓으면 묶음끼리 나란히), 지우기, 추가
import { useState, type FormEvent } from 'react';
import type { CheckItem } from '../../domain/checks';
import { patchIn, removeFrom } from '../../domain/edit';
import { TextInput } from '../../ui/inputs';

interface Props { items: CheckItem[]; onChange: (items: CheckItem[]) => void }

export function Checklist({ items, onChange }: Props) {
  const groups = [...new Set(items.map((x) => x.group))];
  const [group, setGroup] = useState(groups[0] ?? '기타');
  const [text, setText] = useState('');
  const add = (ev: FormEvent) => {
    ev.preventDefault();
    if (!text.trim()) return;
    onChange([...items, { id: crypto.randomUUID(), group: group || '기타', text: text.trim(), done: false }]);
    setText('');
  };
  return (
    <>
      <div className="checkgroups">
        {groups.map((g) => (
          <div key={g} className="checkgroup">
            <h3 className="group-title">{g}</h3>
            <ul className="list checks">
              {items.filter((x) => x.group === g).map((x) => (
                <li key={x.id}>
                  <label className="check">
                    <input type="checkbox" checked={x.done} onChange={(e) => onChange(patchIn(items, x.id, { done: e.target.checked }))} />
                    <span>{x.text}</span>
                  </label>
                  <button type="button" className="icon-btn" aria-label={`${x.text} 지우기`} onClick={() => onChange(removeFrom(items, x.id))}>×</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <form className="add-line" onSubmit={add}>
        <TextInput aria-label="묶음" list="check-groups" placeholder="묶음" maxLength={20} value={group} onValue={setGroup} />
        <datalist id="check-groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
        <TextInput aria-label="확인할 것" placeholder="확인할 것 추가" maxLength={120} value={text} onValue={setText} />
        <button type="submit" className="btn ghost">추가</button>
      </form>
    </>
  );
}
