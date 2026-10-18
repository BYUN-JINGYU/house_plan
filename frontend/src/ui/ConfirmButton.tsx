// 되돌리기 어려운 버튼: 한 번 누르면 확인 문구로 바뀌고, 4초 안에 한 번 더 눌러야 실행
import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  confirm: string;
  onConfirm: () => void;
  className?: string;
}

export function ConfirmButton({ label, confirm, onConfirm, className = 'btn ghost' }: Props) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const click = () => {
    clearTimeout(timer.current);
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    setArmed(false);
    onConfirm();
  };
  return <button type="button" className={`${className}${armed ? ' armed' : ''}`} onClick={click}>{armed ? confirm : label}</button>;
}
