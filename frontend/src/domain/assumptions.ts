// 계획 가정. 공개 저장소라 코드에는 예시 값만 둔다.
// 우리 집 실제 값은 '가정' 탭에서 바꾸거나 백업 파일로 불러와 DB에 덮어쓰기로 저장된다.
export const NUM_DEFAULTS = {
  // 집·세금
  price: 100000, official: 70000, acqRate: 0.033, brokerRate: 0.005, vat: 0.1,
  bondRate: 0.026, bondDisc: 0.1, lawyer: 80, stamp: 35, move: 250, repair: 1000,
  // 대출
  coLoan: 30000, coRate: 0.015, coGrace: 3, coTerm: 10, coLien: 140,
  ggA: 20000, ggB: 20000, ggRate: 0.04, ggTerm: 2, guarRate: 0.009, ggStamp: 15,
  // 소득·지출
  fairRate: 0.046, marginal: 0.385, netMonth: 900, living: 300, upkeep: 25, propTax: 150,
  bufferM: 3, payday: 25,
  // 성과급
  salA: 6000, salB: 6000, ps2027: 0.3, psLater: 0.2, netRatio: 0.57, pi: 200, holiday: 0,
  opi2N: 3, stockChg: 0, depositRate: 0.1,
  // 주식 팔 때
  usdkrw: 1400, krTax: 0.002, usTaxRate: 0.22, usDeduct: 250,
};

export const DATE_DEFAULTS = {
  closingDate: '2027-06-30', depositDate: '2027-02-15', piDate: '2026-12-20',
  psDate: '2027-02-05', holidayDate: '2027-02-25', bonusDate: '2027-04-30',
};

export type NumKey = keyof typeof NUM_DEFAULTS;
export type DateKey = keyof typeof DATE_DEFAULTS;
export type AssumptionKey = NumKey | DateKey;
export type Assumptions = { [K in NumKey]: number } & { [K in DateKey]: string };
export type Overrides = Partial<Assumptions>;

export const DEFAULTS: Assumptions = { ...NUM_DEFAULTS, ...DATE_DEFAULTS };

const isYmd = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
export const isNumKey = (k: string): k is NumKey => k in NUM_DEFAULTS;
export const isDateKey = (k: string): k is DateKey => k in DATE_DEFAULTS;

/** 저장된 덮어쓰기에서 아는 키·맞는 형식만 남긴다 */
export function cleanOverrides(raw: unknown): Overrides {
  const out: Record<string, number | string> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw)) {
    if (isNumKey(k) && typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (isDateKey(k) && isYmd(v)) out[k] = v;
  }
  return out;
}

export const withOverrides = (o: Overrides): Assumptions => ({ ...DEFAULTS, ...o });
