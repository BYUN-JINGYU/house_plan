// 선 그래프 좌표 계산 (순수 함수): 여백, 눈금 간격, x·y 위치
export const MARGIN = { top: 14, right: 88, bottom: 30, left: 50 };
export const HEIGHT = 250;

export function niceStep(range: number): number {
  const raw = Math.max(range, 1) / 5;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

/** x축 라벨 위치: 처음과 끝은 항상, 사이는 every 간격 (끝과 너무 가까운 것은 뺀다) */
export function tickIndexes(n: number, every: number): Set<number> {
  const picks: number[] = [];
  for (let i = 0; i < n; i += every) picks.push(i);
  const last = picks[picks.length - 1];
  if (n > 0 && last !== n - 1) {
    if (n - 1 - last < every) picks.pop();
    picks.push(n - 1);
  }
  return new Set(picks);
}

export interface Geometry {
  width: number;
  n: number;
  ticks: number[];
  bottom: number;
  x: (i: number) => number;
  y: (v: number) => number;
}

export function geometry(width: number, n: number, values: number[]): Geometry {
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const step = niceStep(max - min);
  const top = Math.ceil(max / step) * step;
  const bottom = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = bottom; v <= top + 1e-6; v += step) ticks.push(Math.abs(v) < 1e-6 ? 0 : v);
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  return {
    width, n, ticks, bottom,
    x: (i) => MARGIN.left + (plotW * i) / Math.max(1, n - 1),
    y: (v) => MARGIN.top + (plotH * (top - v)) / (top - bottom || 1),
  };
}
