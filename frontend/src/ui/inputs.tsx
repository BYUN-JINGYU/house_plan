// 입력칸: 금액(만원·원)·비율·숫자는 보기 좋게 보여 주고, 고칠 때는 그대로 받아 해석한다.
import { useState, type InputHTMLAttributes } from 'react';
import { num, parseNum, parsePct, parseWon, parseWonFull, pct, won, wonFull } from '../domain/format';

export type NumberKind = 'won' | 'wonFull' | 'pct' | 'num';

const PARSE: Record<NumberKind, (t: string) => number | null> = {
  won: parseWon, wonFull: parseWonFull, pct: parsePct, num: parseNum,
};
const SHOW: Record<NumberKind, (v: number) => string> = {
  won: (v) => (v ? won(v) : ''),
  wonFull: (v) => (v ? wonFull(v) : ''),
  pct: (v) => pct(v, 4),
  num: (v) => (v ? num(v) : ''),
};

type Base = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>;

interface NumberProps extends Base {
  kind: NumberKind;
  value: number;
  onValue: (v: number) => void;
}

export function NumberInput({ kind, value, onValue, className, ...rest }: NumberProps) {
  const [text, setText] = useState<string | null>(null);
  const invalid = text !== null && PARSE[kind](text) === null;
  return (
    <input
      {...rest}
      className={`num-input ${className ?? ''}`}
      inputMode="decimal"
      autoComplete="off"
      value={text ?? SHOW[kind](value)}
      aria-invalid={invalid || undefined}
      onFocus={() => setText(SHOW[kind](value))}
      onChange={(e) => {
        setText(e.target.value);
        const v = PARSE[kind](e.target.value);
        if (v !== null && v !== value) onValue(v);
      }}
      onBlur={() => setText(null)}
    />
  );
}

interface TextProps extends Base {
  value: string;
  onValue: (v: string) => void;
}

export function TextInput({ value, onValue, className, maxLength = 40, ...rest }: TextProps) {
  return (
    <input
      {...rest}
      className={`text-input ${className ?? ''}`}
      autoComplete="off"
      maxLength={maxLength}
      value={value}
      onChange={(e) => onValue(e.target.value)}
    />
  );
}

export function DateInput({ value, onValue, className, ...rest }: TextProps) {
  return (
    <input
      {...rest}
      type="date"
      className={`text-input date-input ${className ?? ''}`}
      value={value}
      onChange={(e) => { if (e.target.value) onValue(e.target.value); }}
    />
  );
}
