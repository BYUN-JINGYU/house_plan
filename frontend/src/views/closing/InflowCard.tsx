// 잔금 전까지 모을 돈: 월급(생활비 뺀 값), PS, PI, 명절 근무비
import type { Closing } from '../../domain/closing';
import { won } from '../../domain/format';
import type { Scenario } from '../../domain/scenario';
import { Card, Rows } from '../../ui/bits';

export function InflowCard({ s, c }: { s: Scenario; c: Closing }) {
  const i = c.inflows;
  return (
    <Card title="잔금 전까지 모을 돈" value={won(c.inflow)}>
      <Rows rows={[
        { label: `월급 ${s.monthsLeft}번`, note: `생활비 ${won(s.living)}씩 뺀 값`, value: won(i.save) },
        { label: 'PS (세후)', value: won(i.ps) },
        { label: 'PI', value: won(i.pi) },
        { label: '명절 근무비 (세후)', value: won(i.holiday) },
      ]} />
      <p className="hint">이미 받은 돈은 통장 잔액에 있다고 보고 빼요.</p>
      <p className="hint">특별성과급은 잔금 뒤라 넣지 않았어요.</p>
    </Card>
  );
}
