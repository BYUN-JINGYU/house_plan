// '냄' 도장: 낸 달에 찍는다 (누르면 찍고, 다시 누르면 지운다)
interface Props { paid: boolean; label: string; onToggle: () => void }

export function Stamp({ paid, label, onToggle }: Props) {
  return (
    <button type="button" className={`stamp${paid ? ' on' : ''}`} aria-pressed={paid} aria-label={`${label} 냈음`} onClick={onToggle}>
      {paid ? '냄' : ''}
    </button>
  );
}
