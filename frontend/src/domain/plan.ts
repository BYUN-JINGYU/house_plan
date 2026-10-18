// '계획' 문서: 이름, 제목, 가정 덮어쓰기, 계약금 낸 여부, 실시간 환율 사용, 내가 넣은 날짜
import { cleanOverrides, type Overrides } from './assumptions';

export interface Names { a: string; b: string }
export interface PlanEvent { id: string; date: string; text: string }

export interface PlanDoc {
  names: Names;
  title: string;
  overrides: Overrides;
  depositPaid: boolean;
  useLiveFx: boolean;
  events: PlanEvent[];
}

export const DEFAULT_PLAN: PlanDoc = {
  names: { a: '나', b: '짝꿍' },
  title: '우리 집 자금 계획',
  overrides: {},
  depositPaid: false,
  useLiveFx: true,
  events: [],
};

const text = (v: unknown, fallback: string, max = 30) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : fallback;

function events(raw: unknown): PlanEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .map((e) => ({ id: text(e.id, crypto.randomUUID(), 40), date: text(e.date, '', 10), text: text(e.text, '', 60) }))
    .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.text);
}

export function normalizePlan(raw: unknown): PlanDoc {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const names = (o.names && typeof o.names === 'object' ? o.names : {}) as Record<string, unknown>;
  return {
    names: { a: text(names.a, DEFAULT_PLAN.names.a, 8), b: text(names.b, DEFAULT_PLAN.names.b, 8) },
    title: text(o.title, DEFAULT_PLAN.title),
    overrides: cleanOverrides(o.overrides),
    depositPaid: o.depositPaid === true,
    useLiveFx: o.useLiveFx !== false,
    events: events(o.events),
  };
}
