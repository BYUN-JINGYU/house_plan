// 작은 표시 조각: 범례 칩, 장부 줄, 숫자 타일, 가로 막대 목록
import type { ReactNode } from 'react';

export interface Chip { cls: string; label: string; value?: string; tone?: 'bad' | '' }

export function Chips({ items }: { items: Chip[] }) {
  return (
    <ul className="chips">
      {items.map((x) => (
        <li key={x.label} className={x.tone ?? ''}>
          <span className={`sw ${x.cls}`} aria-hidden="true" />
          {x.label}
          {x.value != null && <strong>{x.value}</strong>}
        </li>
      ))}
    </ul>
  );
}

export interface Row { op?: string; label: string; note?: string; value: string; cls?: string }

export function Rows({ rows }: { rows: Row[] }) {
  return (
    <dl className="rows">
      {rows.map((r) => (
        <div key={r.label} className={`row ${r.cls ?? ''}`}>
          <dt>
            {r.op && <span className="op">{r.op}</span>}
            {r.label}
            {r.note && <small>{r.note}</small>}
          </dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: ReactNode; tone?: 'bad' | 'good' }) {
  return (
    <div className="tile">
      <p className="tile-label">{label}</p>
      <p className={`tile-value ${tone ?? ''}`}>{value}</p>
      {sub && <p className="tile-sub">{sub}</p>}
    </div>
  );
}

export interface HBar { label: string; note?: string; v: number; text: string }

/** 한 계열 크기 비교. 큰 순서로 넣는다. */
export function HBars({ items, label }: { items: HBar[]; label: string }) {
  const max = Math.max(1, ...items.map((x) => x.v));
  return (
    <ul className="hbars" aria-label={label}>
      {items.map((x) => (
        <li key={x.label}>
          <span className="hb-label">{x.label}{x.note && <small>{x.note}</small>}</span>
          <strong>{x.text}</strong>
          <span className="hb-track"><span style={{ width: `${(x.v / max) * 100}%` }} /></span>
        </li>
      ))}
    </ul>
  );
}
