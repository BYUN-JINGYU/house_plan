// 선 그래프 (SVG): 축 하나, 끝점 라벨, 십자선 툴팁, 좌우 화살표로 해마다 보기
import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { geometry, HEIGHT, MARGIN, tickIndexes, type Geometry } from './chartGeometry';

export interface Series { name: string; short: string; cls: string; values: number[] }

interface Props {
  labels: string[];
  fullLabels: string[];
  series: Series[];
  label: string;
  helpId?: string;
  format: (v: number) => string;
  axisFormat: (v: number) => string;
  endFormat: (v: number) => string;
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function EndLabels({ g, series, endFormat }: { g: Geometry; series: Series[]; endFormat: Props['endFormat'] }) {
  const last = g.n - 1;
  const ends = series.map((s) => ({ s, yy: g.y(s.values[last]) })).sort((a, b) => a.yy - b.yy);
  return (
    <>
      {ends.map((e, k) => {
        const clash = ends.some((o, j) => j !== k && Math.abs(o.yy - e.yy) < 15);
        return (
          <g key={e.s.cls}>
            <circle className={`dot ${e.s.cls}`} cx={g.x(last)} cy={e.yy} r={4} />
            {!clash && <text className="end" x={g.x(last) + 9} y={e.yy} dominantBaseline="middle">{`${e.s.short} ${endFormat(e.s.values[last])}`}</text>}
          </g>
        );
      })}
    </>
  );
}

export function LineChart({ labels, fullLabels, series, label, helpId, format, axisFormat, endFormat }: Props) {
  const [ref, measured] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const width = Math.max(300, measured);
  const g = useMemo(() => geometry(width, labels.length, series.flatMap((s) => s.values)), [width, labels.length, series]);
  const shown = tickIndexes(g.n, width < 560 ? 3 : 2);
  const show = (i: number | null) => setActive(i == null ? null : Math.max(0, Math.min(g.n - 1, i)));

  const onMove = (ev: PointerEvent<SVGRectElement>) => {
    const box = ev.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const px = ((ev.clientX - box.left) / box.width) * width;
    show(Math.round(((px - MARGIN.left) / (width - MARGIN.left - MARGIN.right)) * (g.n - 1)));
  };
  const onKey = (ev: KeyboardEvent<HTMLDivElement>) => {
    const last = g.n - 1;
    const next = { ArrowLeft: (active ?? last) - 1, ArrowRight: (active ?? -1) + 1, Home: 0, End: last, Escape: null }[ev.key];
    if (next === undefined) return;
    ev.preventDefault();
    show(next);
  };
  const cx = active == null ? 0 : g.x(active);

  return (
    <div ref={ref} className="chart" tabIndex={0} aria-label={label} aria-describedby={helpId}
      onKeyDown={onKey} onFocus={() => show(active ?? g.n - 1)} onBlur={() => show(null)}>
      <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT}>
        {g.ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'axis' : 'gridline'} x1={MARGIN.left} x2={width - MARGIN.right} y1={g.y(t)} y2={g.y(t)} />
            <text className="tick" x={MARGIN.left - 8} y={g.y(t)} textAnchor="end" dominantBaseline="middle">{axisFormat(t)}</text>
          </g>
        ))}
        {labels.map((lab, i) => shown.has(i) && <text key={lab} className="tick" x={g.x(i)} y={HEIGHT - 8} textAnchor="middle">{lab}</text>)}
        {series.map((s) => <polyline key={s.cls} className={`line ${s.cls}`} points={s.values.map((v, i) => `${g.x(i)},${g.y(v)}`).join(' ')} />)}
        <EndLabels g={g} series={series} endFormat={endFormat} />
        {active != null && (
          <g>
            <line className="cross" x1={cx} x2={cx} y1={MARGIN.top} y2={g.y(g.bottom)} />
            {series.map((s) => <circle key={s.cls} className={`dot ${s.cls}`} cx={cx} cy={g.y(s.values[active])} r={4} />)}
          </g>
        )}
        <rect className="hit" x={MARGIN.left - 10} y={0} width={width - MARGIN.left - MARGIN.right + 20} height={HEIGHT - MARGIN.bottom}
          onPointerMove={onMove} onPointerLeave={() => show(null)} />
      </svg>
      {active != null && (
        <div className={`chart-tip ${cx > width / 2 ? 'left' : 'right'}`} style={{ left: `${cx}px` }}>
          <p className="tip-head">{fullLabels[active]}</p>
          {series.map((s) => (
            <p key={s.cls} className="tip-row"><span className={`key ${s.cls}`} /><strong>{format(s.values[active])}</strong><span>{s.name}</span></p>
          ))}
        </div>
      )}
    </div>
  );
}
