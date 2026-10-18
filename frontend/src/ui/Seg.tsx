// 몇 개 중 하나 고르는 버튼 묶음
interface Option<T> { value: T; text: string }

interface Props<T> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  wide?: boolean;
}

export function Seg<T extends string | number>({ label, options, value, onChange, wide }: Props<T>) {
  return (
    <div className={`seg${wide ? ' wide' : ''}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.text}
        </button>
      ))}
    </div>
  );
}
