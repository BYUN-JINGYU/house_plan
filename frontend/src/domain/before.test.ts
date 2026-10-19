// 잔금 전 달마다 흐름: 들어오고 나가는 돈이 제 달에 있고, 끝 잔액에서 비상금을 빼면 잔금 판정과 같다
import { describe, expect, it } from 'vitest';
import { withOverrides } from './assumptions';
import { beforeFlow } from './before';
import { closing } from './closing';
import { buildScenario } from './scenario';

const scene = (paid = false) => buildScenario(withOverrides({ holiday: 100 }), { have: 30000, bonus: 0 }, '2026-10-19', paid);

describe('잔금 전 흐름', () => {
  const s = scene();
  const c = closing(s);
  const rows = beforeFlow(s, c, { a: {}, b: {} });

  it('이번 달부터 잔금 달까지 한 줄씩', () => {
    expect(rows.map((r) => r.month)).toEqual(['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06']);
    expect(rows.at(-1)?.closing).toBe(true);
  });

  it('돈은 제 달에: 월급과 생활비, PI(12월), 계약금·PS·명절 근무비(2월)', () => {
    const labels = (m: string) => rows.find((r) => r.month === m)?.items.map((x) => x.label);
    expect(labels('2026-10')).toEqual(['월급', '생활비']);
    expect(labels('2026-12')).toContain('PI');
    expect(labels('2027-02')).toEqual(expect.arrayContaining(['계약금', 'PS (세후)', '명절 근무비 (세후)']));
    expect(rows.find((r) => r.month === '2027-02')?.items.find((x) => x.label === '계약금')?.amount).toBe(-10000);
  });

  it('끝 잔액 − 비상금 = 잔금 판정의 여유·부족', () => {
    expect((rows.at(-1)?.balance ?? 0) - c.buffer).toBeCloseTo(c.gap);
  });

  it('계약금을 냈으면 흐름에 없고, 판정은 그대로 맞는다', () => {
    const sp = scene(true);
    const cp = closing(sp);
    const paid = beforeFlow(sp, cp, { a: {}, b: {} });
    expect(paid.flatMap((r) => r.items).some((x) => x.label === '계약금')).toBe(false);
    expect((paid.at(-1)?.balance ?? 0) - cp.buffer).toBeCloseTo(cp.gap);
  });
});
