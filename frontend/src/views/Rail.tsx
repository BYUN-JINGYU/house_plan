// 메뉴 띠 (통장 표지 색): 제목, 매매가, 저장 상태, 잔금까지 남은 날, 화면 메뉴, (로그인을 켰으면) 나가기
import type { ReactNode } from 'react';
import { won } from '../domain/format';
import type { Scenario } from '../domain/scenario';
import { daysBetween, parseYmd } from '../domain/schedule';
import { SaveBadge } from '../ui/SaveBadge';

interface Props { title: string; s: Scenario; onLogout?: () => void; children: ReactNode }

function dday(s: Scenario): { label: string; num: string } {
  const days = daysBetween(s.asOf, s.closingDate);
  if (days > 0) return { label: '잔금까지', num: `D-${days}` };
  return days === 0 ? { label: '오늘 잔금', num: 'D-day' } : { label: '잔금 뒤', num: `D+${-days}` };
}

export function Rail({ title, s, onLogout, children }: Props) {
  const { y, m, d } = parseYmd(s.closingDate);
  const left = dday(s);
  return (
    <aside className="rail">
      <div className="brand">
        <p className="brand-title">{title}</p>
        <p className="brand-meta">매매가 {won(s.price)}</p>
        <SaveBadge />
      </div>
      <div className="dday" title={`잔금 ${y}년 ${m}월 ${d}일`}>
        <p className="dday-label">{left.label}</p>
        <p className="dday-num">{left.num}</p>
        <p className="dday-date">{y}.{m}.{d}</p>
      </div>
      {children}
      {onLogout && (
        <div className="rail-foot">
          <button type="button" className="btn ghost small" onClick={onLogout}>이 기기에서 나가기</button>
        </div>
      )}
    </aside>
  );
}
