// 날짜 목록에 내 일정 넣기 (예: 혼인신고 마감, 이사 날)
import { useState, type FormEvent } from 'react';
import type { PlanEvent } from '../../domain/plan';
import { todayKst } from '../../domain/schedule';
import { DateInput, TextInput } from '../../ui/inputs';

export function AddEvent({ onAdd }: { onAdd: (e: PlanEvent) => void }) {
  const [date, setDate] = useState(todayKst);
  const [text, setText] = useState('');
  const add = (ev: FormEvent) => {
    ev.preventDefault();
    if (!text.trim()) return;
    onAdd({ id: crypto.randomUUID(), date, text: text.trim() });
    setText('');
  };
  return (
    <form className="add-line" onSubmit={add}>
      <DateInput aria-label="날짜" value={date} onValue={setDate} />
      <TextInput aria-label="일정" placeholder="일정 추가 (예: 혼인신고)" maxLength={60} value={text} onValue={setText} />
      <button type="submit" className="btn ghost">추가</button>
    </form>
  );
}
