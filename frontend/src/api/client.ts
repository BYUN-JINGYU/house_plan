// 백엔드 호출 공통: JSON, 쿠키, 오류 메시지. 로그인이 풀리면 화면에 알린다.
export class ApiError extends Error {
  constructor(public status: number, message: string, public body: unknown) {
    super(message);
  }
}

export const LOGGED_OUT = 'hp:logged-out';
export const LOGGED_IN = 'hp:logged-in';

function messageOf(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && 'message' in detail) return String((detail as { message: unknown }).message);
  if (status === 0) return '서버에 연결하지 못했어요';
  return status >= 500 ? '서버에 문제가 있어요. 잠시 뒤 다시 해 주세요' : `요청이 안 됐어요 (${status})`;
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, messageOf(null, 0), null);
  }
  if (res.status === 401 && path !== '/api/auth/login') window.dispatchEvent(new Event(LOGGED_OUT));
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, messageOf(data, res.status), data);
  }
  if (res.status === 204) {
    await res.text().catch(() => '');
    return undefined as T;
  }
  return (await res.json()) as T;
}
