// 백업: 내려받기, 불러오기(파일을 고르면 무엇이 바뀌는지 보여 주고 한 번 더 확인)
import { useRef, useState } from 'react';
import { backup, type Backup } from '../../api/endpoints';
import { todayKst } from '../../domain/schedule';

function isBackup(v: unknown): v is Backup {
  return !!v && typeof v === 'object' && (v as Backup).format === 'houseplan-backup' && (v as Backup).version === 1;
}

function summary(b: Backup): string {
  const docs = Object.keys(b.docs ?? {}).length;
  const ledger = Array.isArray(b.ledger) ? `, 가계부 ${b.ledger.length}줄` : ', 가계부는 그대로';
  return `문서 ${docs}개${ledger}`;
}

export function BackupCard() {
  const [status, setStatus] = useState('');
  const [picked, setPicked] = useState<Backup | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const download = async () => {
    try {
      const data = await backup.download();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `houseplan-backup-${todayKst()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('백업 파일을 내려받았어요.');
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const pick = async (f: File) => {
    try {
      const data: unknown = JSON.parse(await f.text());
      if (isBackup(data)) { setPicked(data); setStatus(''); } else setStatus('이 앱의 백업 파일이 아니에요.');
    } catch {
      setStatus('JSON 파일이 아니에요.');
    }
  };

  const restore = async () => {
    if (!picked) return;
    try {
      await backup.restore(picked);
      setStatus('불러왔어요. 화면을 새로 열게요.');
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setStatus((err as Error).message);
    }
    setPicked(null);
  };

  return (
    <section className="card">
      <div className="card-head"><h2>백업</h2></div>
      <p className="sub">무료 DB라 가끔 파일로 내려받아 두세요.</p>
      <div className="btn-row gap-y">
        <button type="button" className="btn ghost" onClick={() => void download()}>내려받기</button>
        <button type="button" className="btn ghost" onClick={() => file.current?.click()}>불러오기</button>
        <input ref={file} type="file" accept="application/json,.json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(f); e.target.value = ''; }} />
      </div>
      {picked && (
        <div className="confirm-box">
          <p>지금 값이 이 파일로 바뀌어요 ({summary(picked)}).</p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => void restore()}>바꾸기</button>
            <button type="button" className="btn ghost" onClick={() => setPicked(null)}>취소</button>
          </div>
        </div>
      )}
      {status && <p className="note">{status}</p>}
    </section>
  );
}
