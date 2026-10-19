// 고르기 메뉴 (화면 메뉴, 사람 탭 안 항목). 화살표·Home·End로도 움직인다 (세로 메뉴든 가로 메뉴든).
import type { KeyboardEvent, ReactNode } from 'react';

export interface TabDef<T extends string> { id: T; label: ReactNode; icon?: ReactNode }

interface Props<T extends string> {
  tabs: TabDef<T>[];
  current: T;
  onSelect: (id: T) => void;
  /** 한 화면에 메뉴가 둘이면 버튼 id 앞머리와 내용 칸 id가 서로 달라야 한다 */
  idPrefix?: string;
  panelId?: string;
  label?: string;
  className?: string;
}

const STEP: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

export function Tabs<T extends string>(props: Props<T>) {
  const { tabs, current, onSelect, idPrefix = 'tab', panelId = 'panel', label = '화면 고르기', className = 'tabs' } = props;
  const move = (ev: KeyboardEvent<HTMLElement>) => {
    const i = tabs.findIndex((t) => t.id === current);
    const next = ev.key === 'Home' ? 0 : ev.key === 'End' ? tabs.length - 1 : STEP[ev.key] !== undefined ? i + STEP[ev.key] : null;
    if (next === null) return;
    ev.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    onSelect(tab.id);
    document.getElementById(`${idPrefix}-${tab.id}`)?.focus();
  };
  return (
    <nav className={className} role="tablist" aria-label={label} onKeyDown={move}>
      {tabs.map((t) => (
        <button key={t.id} id={`${idPrefix}-${t.id}`} type="button" role="tab" aria-selected={t.id === current}
          aria-controls={panelId} tabIndex={t.id === current ? 0 : -1} onClick={() => onSelect(t.id)}>
          {t.icon}{t.label}
        </button>
      ))}
    </nav>
  );
}
