// 한 줄 쌓인 막대 + 마우스를 올리면 그 조각 이름과 금액. 모자란 몫은 빈 점선 칸으로.
import { useState } from 'react';

export interface StackPart { key: string; label: string; v: number; cls: string; text: string }

interface Props {
  parts: StackPart[];
  whole: number;
  label: string;
  short?: { v: number; text: string; label: string };
}

interface Tip { label: string; text: string; x: number }

export function StackBar({ parts, whole, label, short }: Props) {
  const [tip, setTip] = useState<Tip | null>(null);
  const total = Math.max(whole, 1);
  const pieces = [
    ...parts.filter((p) => p.v > 0.5),
    ...(short && short.v > 0.5 ? [{ key: 'short', label: short.label, v: short.v, cls: 'short', text: short.text }] : []),
  ];
  return (
    <div className="stack-wrap" onPointerLeave={() => setTip(null)}>
      <div className="stack" role="img" aria-label={label}>
        {pieces.map((p) => (
          <span
            key={p.key}
            className={`piece ${p.cls}`}
            style={{ width: `${(p.v / total) * 100}%` }}
            onPointerEnter={(e) => {
              const el = e.currentTarget;
              setTip({ label: p.label, text: p.text, x: el.offsetLeft + el.offsetWidth / 2 });
            }}
          />
        ))}
      </div>
      {tip && (
        <p className="bar-tip" style={{ left: `${tip.x}px` }}>
          {tip.label} <strong>{tip.text}</strong>
        </p>
      )}
    </div>
  );
}
