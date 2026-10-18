// 날짜 계산. 'YYYY-MM-DD' 문자열끼리 비교해서 시간대 영향을 받지 않는다.
export type Ymd = string;

const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (y: number, m: number, d: number): Ymd => `${y}-${pad(m)}-${pad(d)}`;

export function parseYmd(s: Ymd): { y: number; m: number; d: number } {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}

const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** 한국 시간 기준 오늘 */
export function todayKst(now: Date = new Date()): Ymd {
  return new Date(now.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
}

/** after < 월급날 < before 인 월급날 수 (월급날이 그달에 없으면 말일) */
export function paydaysBetween(after: Ymd, before: Ymd, day: number): number {
  if (before <= after) return 0;
  const end = parseYmd(before);
  let { y, m } = parseYmd(after);
  let count = 0;
  while (y < end.y || (y === end.y && m <= end.m)) {
    const pay = ymd(y, m, Math.min(Math.max(1, Math.round(day)), lastDay(y, m)));
    if (pay > after && pay < before) count += 1;
    [y, m] = m === 12 ? [y + 1, 1] : [y, m + 1];
  }
  return count;
}

export function daysBetween(from: Ymd, to: Ymd): number {
  const f = parseYmd(from);
  const t = parseYmd(to);
  return Math.round((Date.UTC(t.y, t.m - 1, t.d) - Date.UTC(f.y, f.m - 1, f.d)) / 86_400_000);
}

export function dateLabel(s: Ymd): string {
  const { m, d } = parseYmd(s);
  return `${m}월 ${d}일`;
}

export function fullDateLabel(s: Ymd): string {
  const { y, m, d } = parseYmd(s);
  return `${y}.${m}.${d}`;
}
