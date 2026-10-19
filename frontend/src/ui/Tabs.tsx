// 화면 고르기 메뉴. 화살표·Home·End로도 움직인다 (세로 메뉴든 가로 메뉴든).
import type { KeyboardEvent } from 'react';

export interface TabDef<T extends string> { id: T; label: string }

interface Props<T extends string> {
  tabs: TabDef<T>[];
  current: T;
  onSelect: (id: T) => void;
}

const STEP: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

export function Tabs<T extends string>({ tabs, current, onSelect }: Props<T>) {
  const move = (ev: KeyboardEvent<HTMLElement>) => {
    const i = tabs.findIndex((t) => t.id === current);
    const next = ev.key === 'Home' ? 0 : ev.key === 'End' ? tabs.length - 1 : STEP[ev.key] !== undefined ? i + STEP[ev.key] : null;
    if (next === null) return;
    ev.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    onSelect(tab.id);
    document.getElementById(`tab-${tab.id}`)?.focus();
  };
  return (
    <nav className="tabs" role="tablist" aria-label="화면 고르기" onKeyDown={move}>
      {tabs.map((t) => (
        <button key={t.id} id={`tab-${t.id}`} type="button" role="tab" aria-selected={t.id === current}
          aria-controls="panel" tabIndex={t.id === current ? 0 : -1} onClick={() => onSelect(t.id)}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
