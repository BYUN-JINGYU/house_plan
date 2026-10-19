// 점검할 것: 계산에서 눈여겨볼 숫자를 한 줄로 (경고 → 참고 → 좋은 점, 최대 5개).
// 무엇을 하라고 정하지 않고, 숫자와 확인할 곳만 짚는다.
import { effectiveCoRate } from './closing';
import type { PlanModel } from './compute';
import { pct, won } from './format';
import { monthLabel } from './ledger';
import type { Portfolio } from './portfolio';
import type { StressResult } from './stress';

export type InsightTab = 'assets' | 'before' | 'closing' | 'after';
export interface Insight { id: string; tone: 'warn' | 'info' | 'good'; text: string; tab: InsightTab }

const ORDER = { warn: 0, info: 1, good: 2 };

export function insights(m: PlanModel, stress: StressResult, ports: { name: string; p: Portfolio }[]): Insight[] {
  const { s, c, hh, loans } = m;
  const out: Insight[] = [];
  const d = (id: string) => stress.rows.find((r) => r.id === id)?.d;
  if (c.have <= 0) out.push({ id: 'assets', tone: 'warn', text: '자산을 넣어야 잔금 판정이 나와요.', tab: 'assets' });
  if (c.inflow > 0 && c.inflows.ps / c.inflow >= 0.3) {
    out.push({ id: 'ps', tone: 'warn', text: `모을 돈의 ${pct(c.inflows.ps / c.inflow, 0)}가 PS예요. PS가 0이면 ${won(-(d('ps0')?.gap ?? 0))} 더 필요해요.`, tab: 'before' });
  }
  const due = loans.find((r) => r.maturity);
  if (due && due.ggBal > 0.5) out.push({ id: 'maturity', tone: 'warn', text: `${monthLabel(due.month)} 금고 만기에 ${won(due.ggBal)}이 남아요. 연장 조건을 미리 봐요.`, tab: 'after' });
  const g1 = d('gg1');
  if (g1 && g1.monthly < -0.5) out.push({ id: 'rate', tone: 'info', text: `금고 금리가 1%p 오르면 잔금 뒤 매달 ${won(-g1.monthly)} 더 나가요.`, tab: 'after' });
  for (const { name, p } of ports) {
    if (p.top && p.total >= 100 && p.top.share >= 0.4 && p.slices.length > 0) {
      out.push({ id: `top-${name}`, tone: 'info', text: `${name} 주식의 ${pct(p.top.share, 0)}가 ${p.top.label} 한 종목이에요.`, tab: 'assets' });
    }
    if (p.saving >= 1) out.push({ id: `tax-${name}`, tone: 'good', text: `${name} 해외주식을 두 해에 나눠 팔면 양도세 ${won(p.saving)}을 아껴요.`, tab: 'assets' });
  }
  const all = c.have + hh.bonus;
  if (all > 0 && hh.bonus / all >= 0.3) out.push({ id: 'company', tone: 'info', text: `자산의 ${pct(hh.bonus / all, 0)}가 특별성과급(회사 주식)이에요.`, tab: 'assets' });
  if (s.coLoan > 0) out.push({ id: 'co-rate', tone: 'info', text: `사내대출은 이자 혜택 세금까지 실제 연 ${pct(effectiveCoRate(s), 2)}예요.`, tab: 'closing' });
  return out.sort((x, y) => ORDER[x.tone] - ORDER[y.tone]).slice(0, 5);
}
