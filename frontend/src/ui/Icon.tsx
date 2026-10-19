// 메뉴·카드용 선 아이콘 (24 격자, 글자색을 따른다). 장식이라 화면 읽기에서는 숨긴다.
export type IconName = 'home' | 'wallet' | 'seed' | 'key' | 'house' | 'book' | 'check' | 'sliders';

const PATHS: Record<IconName, string> = {
  home: 'M4 13h6V5H4zM14 19h6v-8h-6zM4 19h6v-3H4zM14 8h6V5h-6z',
  wallet: 'M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3M4 7.5V17a2 2 0 0 0 2 2h14V8H6.5A2.5 2.5 0 0 1 4 7.5ZM16 13.5h1.5',
  seed: 'M12 20v-8M12 12C12 8 9 6 5 6c0 4 3 6 7 6ZM12 14c0-3.5 2.5-6 7-6 0 4-3 6-7 6Z',
  key: 'M14.5 9.5a4 4 0 1 1-1.2-2.9M14.5 9.5 21 16v3h-3v-2h-2v-2h-1.5M8 9.5h.01',
  house: 'M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3ZM5 17a3 3 0 0 1 3-3h11M9 8h6',
  check: 'M5 12.5 9.5 17 19 7.5',
  sliders: 'M5 7h9M18 7h1M5 17h3M12 17h7M14 4.5v5M8 14.5v5',
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
