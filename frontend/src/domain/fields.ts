// '가정' 탭의 입력 항목. {a}, {b}는 사람 이름으로 바뀐다.
import type { AssumptionKey } from './assumptions';
import type { Names } from './plan';

export type FieldKind = 'won' | 'pct' | 'num' | 'date';
export interface FieldDef { key: AssumptionKey; label: string; kind: FieldKind; note?: string }
export interface FieldGroup { title: string; fields: FieldDef[] }

const f = (key: AssumptionKey, label: string, kind: FieldKind, note?: string): FieldDef => ({ key, label, kind, note });

export const FIELD_GROUPS: FieldGroup[] = [
  { title: '날짜', fields: [
    f('closingDate', '잔금일', 'date'),
    f('depositDate', '계약금 내는 날', 'date', '토지거래허가 후 본계약'),
    f('piDate', 'PI 받는 날', 'date'),
    f('psDate', 'PS 받는 날', 'date'),
    f('holidayDate', '명절 근무비 받는 날', 'date'),
    f('bonusDate', '특별성과급 받는 날', 'date', '자사주'),
    f('payday', '월급날 (매달 며칠)', 'num'),
  ] },
  { title: '집·세금', fields: [
    f('price', '매매가', 'won'),
    f('official', '공시가격', 'won', '추정이면 시세의 약 70%'),
    f('acqRate', '취득세+지방교육세', 'pct', '9억 초과 1주택, 85㎡ 이하 3.3%'),
    f('brokerRate', '중개보수 상한', 'pct', '9~12억 0.5%, 12~15억 0.6%'),
    f('vat', '중개보수 부가세', 'pct'),
    f('bondRate', '국민주택채권 매입률', 'pct', '지역·시가표준액 따라'),
    f('bondDisc', '채권 즉시매도 할인', 'pct', '시장금리 따라 변함'),
    f('lawyer', '법무사', 'won'),
    f('stamp', '매매계약서 인지세', 'won'),
    f('move', '이사·입주청소', 'won'),
    f('repair', '수리', 'won', '도배·장판 수준'),
  ] },
  { title: '대출', fields: [
    f('coLoan', '사내대출 ({a})', 'won', '회사 규정 한도'),
    f('coRate', '사내대출 금리', 'pct'),
    f('coGrace', '거치 (년)', 'num'),
    f('coTerm', '상환 (년)', 'num'),
    f('coLien', '근저당 설정비', 'won', '회사 부담이면 0'),
    f('ggA', '금고 대출 ({a})', 'won'),
    f('ggB', '금고 대출 ({b})', 'won'),
    f('ggRate', '금고 금리', 'pct'),
    f('ggTerm', '금고 만기 (년)', 'num', '일시상환'),
    f('guarRate', '보증보험료 (연)', 'pct'),
    f('ggStamp', '금고 인지세', 'won', '두 사람 본인 몫'),
  ] },
  { title: '소득·지출', fields: [
    f('netMonth', '월 실수령 (둘 합계)', 'won'),
    f('living', '생활비 (월)', 'won'),
    f('upkeep', '관리비·공과금 (월)', 'won', '생활비에 있으면 0'),
    f('propTax', '재산세 (연)', 'won', '7월·9월'),
    f('bufferM', '비상금 (개월)', 'num'),
    f('fairRate', '세법상 적정이자율', 'pct', '사내대출 금리와 차이가 근로소득'),
    f('marginal', '{a} 한계세율', 'pct', '소득세+지방세+건보·고용'),
  ] },
  { title: '성과급', fields: [
    f('salA', '{a} 계약연봉', 'won'),
    f('salB', '{b} 계약연봉', 'won'),
    f('ps2027', '잔금 전 PS', 'pct', '계약연봉 대비'),
    f('psLater', '잔금 후 PS (매년)', 'pct', '계약연봉 대비'),
    f('netRatio', '성과급 세후 비율', 'pct'),
    f('pi', 'PI (둘 합계, 세후)', 'won'),
    f('holiday', '명절 근무비 (세전)', 'won'),
    f('opi2N', '특별성과급 나눠 파는 횟수', 'num', '바로, 1년 뒤, 2년 뒤면 3'),
    f('stockChg', '팔 때 주가 변동', 'pct', '지급일 대비'),
    f('depositRate', '계약금 비율', 'pct'),
  ] },
  { title: '주식 팔 때', fields: [
    f('usdkrw', '원/달러 환율', 'num', '실시간 환율을 못 받을 때'),
    f('krTax', '국내 증권거래세', 'pct', '2026년 0.20%'),
    f('usTaxRate', '해외주식 양도세율', 'pct', '지방세 포함'),
    f('usDeduct', '해외주식 기본공제 (1인·1년)', 'won'),
  ] },
];

export const labelFor = (label: string, names: Names) => label.replace('{a}', names.a).replace('{b}', names.b);
