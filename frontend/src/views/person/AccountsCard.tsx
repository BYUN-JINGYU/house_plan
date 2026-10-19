// 증권 계좌: 이름과 수수료 3가지 (팔 때 빼는 값). 계좌를 지우면 그 계좌 종목도 지운다.
import { newBroker, patchIn, removeFrom } from '../../domain/edit';
import { won } from '../../domain/format';
import type { Broker, BrokerSale } from '../../domain/stocks';
import { Card } from '../../ui/bits';
import { ConfirmButton } from '../../ui/ConfirmButton';
import { NumberInput, TextInput } from '../../ui/inputs';

interface Props { brokers: Broker[]; sales: BrokerSale[]; onChange: (brokers: Broker[]) => void }

export function AccountsCard({ brokers, sales, onChange }: Props) {
  const set = (id: string, p: Partial<Broker>) => onChange(patchIn(brokers, id, p));
  return (
    <Card title="증권 계좌와 수수료">
      <ul className="list accounts">
        {brokers.map((b, i) => (
          <li key={b.id}>
            <div className="acct-head">
              <TextInput aria-label="증권사 이름" placeholder="증권사 이름" value={b.name} onValue={(name) => set(b.id, { name })} />
              <span className="acct-net">팔면 {won(sales[i]?.net ?? 0)}</span>
            </div>
            <div className="fees">
              <label className="mini">국내 수수료<NumberInput kind="pct" value={b.krFee} onValue={(krFee) => set(b.id, { krFee })} /></label>
              <label className="mini">해외 수수료<NumberInput kind="pct" value={b.usFee} onValue={(usFee) => set(b.id, { usFee })} /></label>
              <label className="mini">환전 수수료<NumberInput kind="pct" value={b.fxFee} onValue={(fxFee) => set(b.id, { fxFee })} /></label>
            </div>
            <ConfirmButton className="linkish danger" label="계좌 지우기"
              confirm={b.holdings.length ? `종목 ${b.holdings.length}개도 같이 지워요` : '한 번 더 누르면 지워요'}
              onConfirm={() => onChange(removeFrom(brokers, b.id))} />
          </li>
        ))}
      </ul>
      <div className="card-foot">
        <button type="button" className="linkish" onClick={() => onChange([...brokers, newBroker()])}>+ 증권 계좌 추가</button>
      </div>
      <p className="hint">수수료는 증권사 앱에서 보이는 값으로 바꿔요.</p>
    </Card>
  );
}
