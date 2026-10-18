// 들어갈 때 비밀번호: 쿠키가 살아 있는지 확인하고, 로그인·로그아웃한다.
// 쓰다가 세션이 끝나면 화면은 그대로 두고 비밀번호만 다시 묻는다 (expired).
import { useCallback, useEffect, useState } from 'react';
import { LOGGED_IN, LOGGED_OUT } from '../api/client';
import { auth } from '../api/endpoints';

export type AuthState = 'checking' | 'in' | 'out' | 'expired';

export function useAuth() {
  const [state, setState] = useState<AuthState>('checking');

  useEffect(() => {
    auth.me().then(() => setState('in')).catch(() => setState('out'));
    const lost = () => setState((s) => (s === 'in' || s === 'expired' ? 'expired' : 'out'));
    window.addEventListener(LOGGED_OUT, lost);
    return () => window.removeEventListener(LOGGED_OUT, lost);
  }, []);

  const login = useCallback(async (password: string) => {
    await auth.login(password);
    setState('in');
    window.dispatchEvent(new Event(LOGGED_IN));
  }, []);

  const logout = useCallback(async () => {
    await auth.logout().catch(() => undefined);
    setState('out');
  }, []);

  return { state, login, logout };
}
