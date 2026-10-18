// 참고 링크: 제목 + 주소, 추가·지우기
import { useState, type FormEvent } from 'react';
import type { LinkItem } from '../../domain/checks';
import { removeFrom } from '../../domain/edit';
import { TextInput } from '../../ui/inputs';

interface Props { links: LinkItem[]; onChange: (links: LinkItem[]) => void }

export function Links({ links, onChange }: Props) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const valid = title.trim() && /^https?:\/\/\S+$/i.test(url.trim());
  const add = (ev: FormEvent) => {
    ev.preventDefault();
    if (!valid) return;
    onChange([...links, { id: crypto.randomUUID(), title: title.trim(), url: url.trim() }]);
    setTitle('');
    setUrl('');
  };
  return (
    <div>
      <h2 className="gap-top">참고 링크</h2>
      <ul className="sources">
        {links.map((l) => (
          <li key={l.id}>
            <a href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a>
            <button type="button" className="icon-btn" aria-label={`${l.title} 지우기`} onClick={() => onChange(removeFrom(links, l.id))}>×</button>
          </li>
        ))}
      </ul>
      <form className="add-line" onSubmit={add}>
        <TextInput aria-label="링크 제목" placeholder="제목" maxLength={80} value={title} onValue={setTitle} />
        <TextInput aria-label="링크 주소" placeholder="https://" maxLength={400} value={url} onValue={setUrl} />
        <button type="submit" className="btn ghost" disabled={!valid}>추가</button>
      </form>
    </div>
  );
}
