// 작은 표시 조각: 카드, 숫자 카드, 상태 배지, 접는 설명, 줄 목록, 크기 비교 막대
import type { ReactNode } from 'react';

interface CardProps { title?: ReactNode; value?: string; className?: string; children?: ReactNode }

/** 제목과 숫자 하나를 가진 카드 */
export function Card({ title, value, className, children }: CardProps) {
  return (
    <section className={`card ${className ?? ''}`}>
      {(title || value) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {value && <strong className="card-value">{value}</strong>}
        </div>
      )}
      {children}
    </section>
  );
}

interface PageHeadProps { title: string; numLabel?: string; num?: string; sub?: ReactNode }

/** 화면 제목 + (있으면) 큰 숫자 하나 + 한 줄 설명 */
export function PageHead({ title, numLabel, num, sub }: PageHeadProps) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      {numLabel && <p className="page-num-label">{numLabel}</p>}
      {num && <p className="page-num">{num}</p>}
      {sub && <p className="page-sub">{sub}</p>}
    </header>
  );
}

export type Tone = 'good' | 'bad' | '';

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: ReactNode; tone?: Tone }) {
  return (
    <div className="stat">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${tone ?? ''}`}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

/** 긴 설명은 접어 둔다 */
export function More({ children, label = '자세히' }: { children: ReactNode; label?: string }) {
  return (
    <details className="more">
      <summary>{label}</summary>
      {children}
    </details>
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

export interface LegendItem { cls: string; label: string; value: string; tone?: Tone }

/** 범례: 색, 이름, 값 (색만으로 구분하지 않게 값을 함께) */
export function LegendGrid({ items }: { items: LegendItem[] }) {
  return (
    <ul className="legend-grid">
      {items.map((x) => (
        <li key={x.label} className={x.tone ?? ''}>
          <span className={`sw ${x.cls}`} aria-hidden="true" />
          <span className="lg-label">{x.label}</span>
          <strong>{x.value}</strong>
        </li>
      ))}
    </ul>
  );
}
