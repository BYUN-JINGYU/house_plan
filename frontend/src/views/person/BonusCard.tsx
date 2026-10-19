// 특별성과급 (세후): 회사 공지 금액. 잔금 뒤 나눠 팔아 금고를 갚는 데 쓴다.
import { won } from '../../domain/format';
import { Card } from '../../ui/bits';
import { NumberInput } from '../../ui/inputs';

export function BonusCard({ value, onValue }: { value: number; onValue: (v: number) => void }) {
  return (
    <Card title="특별성과급 (세후)" value={won(value)}>
      <NumberInput kind="won" aria-label="특별성과급 세후 (만원)" placeholder="회사 공지 금액 (만원)" value={value} onValue={onValue} />
      <p className="hint">잔금 뒤 나눠 팔아서 금고를 갚는 데 써요.</p>
      <p className="hint">PI·PS는 둘 합계라 가정 탭에서 바꿔요.</p>
    </Card>
  );
}
