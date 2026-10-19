// '할 일' 문서: 확인할 것(묶음별)과 참고 링크. 처음에는 일반적인 목록으로 시작한다.
export interface CheckItem { id: string; group: string; text: string; done: boolean }
export interface LinkItem { id: string; title: string; url: string }
export interface ChecksDoc { items: CheckItem[]; links: LinkItem[] }

const item = (id: string, group: string, text: string): CheckItem => ({ id, group, text, done: false });

export const DEFAULT_CHECKS: ChecksDoc = {
  items: [
    item('gg-dsr', '금고 대출', '1인 한도와 DSR 계산 확인'),
    item('gg-fee', '금고 대출', '보증보험료율, 일찍 갚으면 환급되는지'),
    item('gg-prepay', '금고 대출', '중도상환수수료'),
    item('gg-extend', '금고 대출', '만기 때 연장되는지'),
    item('gg-quota', '금고 대출', '실행일 확정 (대출 총량 관리 중)'),
    item('co-terms', '회사', '사내대출 금리와 근저당 설정비 부담'),
    item('co-tax', '회사', '이자 혜택 과세가 월급에 반영되는 방식'),
    item('co-quit', '회사', '퇴직하면 사내대출 상환 조건'),
    item('ob-date', '회사', '특별성과급 지급일과 세후 주식 수'),
    item('ob-tax', '세금·계약', '다음 해 연말정산 때 추가 납부 가능성'),
    item('fund-plan', '세금·계약', '허가 신청 전에 대출 금액 확정 (자금조달계획서)'),
    item('tax-price', '세금·계약', '공시가격·재산세 실제 값 (지금은 추정)'),
  ],
  links: [
    { id: 'l-guar', title: '보증보험료율 예시 · 하나은행', url: 'https://kebhana.com/cont/mall/mall08/mall0802/mall080202/1431726_115196.jsp' },
    { id: 'l-lowrate', title: '저리 대여 이익 과세 · 비즈넵', url: 'https://ai.bznav.com/contents/3190615' },
    { id: 'l-quota', title: '금고 대출 총량 관리 · 머니투데이', url: 'https://www.mt.co.kr/article/2026060114261419409' },
  ],
};

/** 단계별로 한 번에 더하는 할 일 (기한은 법에 정해진 것만: 취득세 60일, 전입신고 14일) */
export const PHASE_TODOS: Record<'closing' | 'after', CheckItem[]> = {
  closing: [
    item('p-loan', '구입일', '대출 실행 시간과 받는 계좌 확인 (잔금 당일)'),
    item('p-reg', '구입일', '법무사에게 등기 서류와 비용 받기'),
    item('p-acq', '구입일', '취득세 신고·납부 (잔금일부터 60일 안)'),
    item('p-move', '구입일', '전입신고 (이사한 날부터 14일 안)'),
    item('p-fee', '구입일', '관리비·장기수선충당금 정산'),
    item('p-util', '구입일', '전기·가스·인터넷 명의 바꾸기'),
    item('p-fire', '구입일', '화재보험이 필요한지 확인'),
  ],
  after: [
    item('a-auto', '구매 후', '대출 이자 자동이체 계좌에 돈 두기'),
    item('a-tax', '구매 후', '재산세 7월·9월 고지서 확인'),
    item('a-gg', '구매 후', '금고 만기 3달 전에 연장할지 갚을지 정하기'),
    item('a-rate', '구매 후', '금리가 바뀌면 구매 후 탭에 넣기'),
    item('a-year', '구매 후', '연말정산 때 받을 수 있는 주택 공제 확인'),
  ],
};

/** 단계 묶음을 더한다 (이미 있는 것은 건너뜀) */
export function withPhase(items: CheckItem[], phase: keyof typeof PHASE_TODOS): CheckItem[] {
  const have = new Set(items.map((x) => x.id));
  return [...items, ...PHASE_TODOS[phase].filter((x) => !have.has(x.id))];
}

const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isWebUrl = (u: string) => /^https?:\/\//i.test(u);

export function normalizeChecks(raw: unknown): ChecksDoc {
  if (!raw || typeof raw !== 'object') return DEFAULT_CHECKS;
  const o = raw as Record<string, unknown>;
  const rows = (v: unknown) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') as Record<string, unknown>[] : []);
  return {
    items: rows(o.items)
      .map((x) => ({ id: s(x.id, 40) || crypto.randomUUID(), group: s(x.group, 20) || '기타', text: s(x.text, 120), done: x.done === true }))
      .filter((x) => x.text),
    links: rows(o.links)
      .map((x) => ({ id: s(x.id, 40) || crypto.randomUUID(), title: s(x.title, 80), url: s(x.url, 400) }))
      .filter((x) => x.title && isWebUrl(x.url)),
  };
}
