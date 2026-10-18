// 잔금 전후 날짜. 계획 날짜 + 내가 넣은 날짜를 날짜순으로, 잔금 후에는 해마다 같은 달로 묶는다.
import type { Closing } from './closing';
import { won } from './format';
import type { PlanEvent } from './plan';
import type { Scenario } from './scenario';
import { dateLabel, parseYmd, type Ymd } from './schedule';
import type { Outlook } from './yearly';

export interface TimelineItem { when: string; what: string; key: boolean; past: boolean; eventId?: string }

interface Dated { date: Ymd; what: string; key?: boolean; eventId?: string }

function planned(s: Scenario, c: Closing): Dated[] {
  const parts = Math.max(1, Math.round(s.opi2N));
  const ps = (s.salA + s.salB) * s.ps2027 * s.netRatio;
  return [
    { date: s.piDate, what: `PI ${won(s.pi)} (둘 합계)` },
    { date: s.depositDate, what: `토지거래허가 → 본계약, 계약금 ${won(c.deposit)}` },
    { date: s.psDate, what: `PS 세후 ${won(ps)}` },
    ...(s.holiday > 0 ? [{ date: s.holidayDate, what: `명절 근무비 세후 ${won(s.holiday * s.netRatio)}` }] : []),
    { date: s.bonusDate, what: `특별성과급 자사주, 1/${parts} 바로 팔 수 있음` },
    { date: s.closingDate, what: '잔금 · 등기 · 전입', key: true },
  ];
}

function yearly(s: Scenario, o: Outlook): [string, TimelineItem][] {
  const parts = Math.max(1, Math.round(s.opi2N));
  const later = new Map<number, string[]>();
  const add = (year: number, text: string) => later.set(year, [...(later.get(year) ?? []), text]);
  for (let k = 1; k < parts; k += 1) add(s.closeYear + k, `특별성과급 1/${parts} 더 팔 수 있음`);
  add(s.closeYear + Math.round(s.ggTerm), `금고 만기 (남는 금고 ${won(o.atMaturity)})`);
  add(s.closeYear + Math.round(s.coGrace), `사내대출 원리금 시작 (월 ${won(o.afterGrace.coPay / 12)})`);
  const month = String(s.closeMonth).padStart(2, '0');
  return [...later.entries()].map(([year, list]) => {
    const sort = `${year}-${month}-00`;
    return [sort, { when: `${year}년 ${s.closeMonth}월`, what: list.join(' · '), key: false, past: sort < s.asOf }];
  });
}

export function timeline(s: Scenario, c: Closing, o: Outlook, events: PlanEvent[] = []): TimelineItem[] {
  const dated: Dated[] = [...planned(s, c), ...events.map((e) => ({ date: e.date, what: e.text, eventId: e.id }))];
  const items: [string, TimelineItem][] = dated.map((d) => {
    const { y } = parseYmd(d.date);
    const when = d.date > s.closingDate ? `${y}년 ${dateLabel(d.date)}` : dateLabel(d.date);
    return [d.date, { when, what: d.what, key: Boolean(d.key), past: d.date < s.asOf, eventId: d.eventId }];
  });
  return [...items, ...yearly(s, o)].sort((x, y) => x[0].localeCompare(y[0])).map(([, item]) => item);
}
