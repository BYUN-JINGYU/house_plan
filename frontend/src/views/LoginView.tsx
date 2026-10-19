// 들어갈 때 비밀번호 (again: 쓰다가 세션이 끝나서 다시 묻는 경우)
import { useState, type FormEvent } from 'react';

interface Props { onLogin: (password: string) => Promise<void>; again?: boolean }

export function LoginView({ onLogin, again = false }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!password) return;
    setBusy(true);
    setError('');
    try {
      await onLogin(password);
    } catch (err) {
      setError((err as Error).message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card login-card" onSubmit={submit}>
      <p className="app-name">우리 집 자금 계획</p>
      <h1>{again ? '다시 로그인해 주세요' : '비밀번호를 넣어 주세요'}</h1>
      <input className="text-input" type="password" autoComplete="current-password" autoFocus aria-label="비밀번호"
        value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="btn" type="submit" disabled={busy || !password}>{busy ? '확인하는 중…' : '들어가기'}</button>
      {error && <p className="note bad" role="alert">{error}</p>}
      <p className="hint">{again ? '고치던 내용은 들어가면 이어서 저장돼요.' : '한 번 들어가면 이 기기에서 30일 동안 유지돼요.'}</p>
    </form>
  );
}
