// 머리띠: 제목, 매매가·잔금일·D-day, 저장 상태, 나가기 + 탭
import type { ReactNode } from 'react';
import { won } from '../domain/format';
import type { Scenario } from '../domain/scenario';
import { daysBetween, fullDateLabel } from '../domain/schedule';
import { SaveBadge } from '../ui/SaveBadge';

interface Props { title: string; s: Scenario; onLogout: () => void; children: ReactNode }

export function Header({ title, s, onLogout, children }: Props) {
  const days = daysBetween(s.asOf, s.closingDate);
  const dday = days > 0 ? `D-${days}` : days === 0 ? 'D-day' : `잔금 후 ${-days}일`;
  return (
    <header className="bar">
      <div className="wrap bar-inner">
        <div className="id">
          <h1>{title}</h1>
          <p className="meta">
            <span>매매가 {won(s.price)}</span>
            <span>잔금 {fullDateLabel(s.closingDate)}</span>
            <span className="dday">{dday}</span>
          </p>
        </div>
        <div className="bar-tools">
          <SaveBadge />
          <button type="button" className="btn ghost small" onClick={onLogout}>나가기</button>
        </div>
      </div>
      {children}
    </header>
  );
}
