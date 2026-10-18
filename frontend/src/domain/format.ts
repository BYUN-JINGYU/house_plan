// 금액 표시와 입력 해석. 계획 금액은 만원, 가계부는 원, 주가는 원(국내)·달러(미국)
const nf = new Intl.NumberFormat('ko-KR');
const nf4 = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 4 });

/** 만원 → "4억 641만" */
export function won(v: number, { sign = false } = {}): string {
  if (!Number.isFinite(v)) return '—';
  const r = Math.round(v);
  const a = Math.abs(r);
  const eok = Math.floor(a / 10000);
  const man = a % 10000;
  const body = a === 0 ? '0'
    : eok && man ? `${nf.format(eok)}억 ${nf.format(man)}만`
      : eok ? `${nf.format(eok)}억` : `${nf.format(man)}만`;
  const lead = r < 0 ? '−' : sign && r > 0 ? '+' : '';
  return lead + body;
}

/** 만원 → "1.9억" / "508만" (좁은 자리) */
export function compactWon(v: number): string {
  if (!Number.isFinite(v) || Math.abs(v) < 0.5) return '0';
  return Math.abs(v) >= 10000 ? `${(v / 10000).toFixed(1).replace(/\.0$/, '')}억` : `${nf.format(Math.round(v))}만`;
}

/** 그래프 축 눈금 (만원) */
export function axisWon(v: number): string {
  if (v === 0) return '0';
  if (v % 10000 === 0) return `${v / 10000}억`;
  return Math.abs(v) >= 10000 ? `${(v / 10000).toFixed(1)}억` : `${nf.format(v)}만`;
}

/** 원 → "35만 2,000원" (가계부) */
export function wonFull(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const r = Math.round(v);
  const a = Math.abs(r);
  const man = Math.floor(a / 10000);
  const rest = a % 10000;
  const body = a === 0 ? '0원'
    : man && rest ? `${won(man)} ${nf.format(rest)}원`
      : man ? `${won(man)}원` : `${nf.format(rest)}원`;
  return (r < 0 ? '−' : '') + body;
}

export function pct(v: number, digits = 1): string {
  if (!Number.isFinite(v)) return '—';
  const s = (v * 100).toFixed(digits);
  return `${s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s}%`;
}

export const num = (v: number): string => (Number.isFinite(v) ? nf4.format(v) : '');

/** "1.5억", "1억 5,000만", "15000" → 만원 */
export function parseWon(text: string): number | null {
  const t = String(text ?? '').replace(/[,\s원]/g, '');
  if (t === '') return 0;
  let m = t.match(/^(\d+(?:\.\d+)?)억(?:(\d+(?:\.\d+)?)만?)?$/);
  if (m) return Number(m[1]) * 10000 + (m[2] ? Number(m[2]) : 0);
  m = t.match(/^(\d+(?:\.\d+)?)만?$/);
  return m ? Number(m[1]) : null;
}

/** "35만", "35만2000", "3.5만", "352,000" → 원 */
export function parseWonFull(text: string): number | null {
  const t = String(text ?? '').replace(/[,\s원]/g, '');
  if (t === '') return 0;
  let m = t.match(/^(\d+(?:\.\d+)?)억(?:(\d+(?:\.\d+)?)만)?(\d+)?$/);
  if (m) return Math.round(Number(m[1]) * 1e8 + Number(m[2] ?? 0) * 1e4 + Number(m[3] ?? 0));
  m = t.match(/^(\d+(?:\.\d+)?)만(\d+)?$/);
  if (m) return Math.round(Number(m[1]) * 1e4 + Number(m[2] ?? 0));
  return /^\d+$/.test(t) ? Number(t) : null;
}

export function parsePct(text: string): number | null {
  const t = String(text ?? '').replace(/[\s%]/g, '').replace('−', '-');
  if (t === '') return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n / 100 : null;
}

export function parseNum(text: string): number | null {
  const t = String(text ?? '').replace(/[,\s$원]/g, '');
  if (t === '') return 0;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
