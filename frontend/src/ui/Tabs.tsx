// 화면 고르기 탭. 좌우 화살표·Home·End로도 움직인다.
import type { KeyboardEvent } from 'react';

export interface TabDef<T extends string> { id: T; label: string }

interface Props<T extends string> {
  tabs: TabDef<T>[];
  current: T;
  onSelect: (id: T) => void;
}

export function Tabs<T extends string>({ tabs, current, onSelect }: Props<T>) {
  const move = (ev: KeyboardEvent<HTMLElement>) => {
    const i = tabs.findIndex((t) => t.id === current);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[ev.key];
    if (next === undefined) return;
    ev.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    onSelect(tab.id);
    document.getElementById(`tab-${tab.id}`)?.focus();
  };
  return (
    <nav className="wrap tabs" role="tablist" aria-label="화면 고르기" onKeyDown={move}>
      {tabs.map((t) => (
        <button key={t.id} id={`tab-${t.id}`} type="button" role="tab" aria-selected={t.id === current}
          aria-controls="panel" tabIndex={t.id === current ? 0 : -1} onClick={() => onSelect(t.id)}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
