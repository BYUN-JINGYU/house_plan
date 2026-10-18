// 키 순서와 상관없이 같은 값이면 같은 글자가 되도록 JSON으로 바꾼다 (보낸 값과 서버 값 비교용)
export function stable(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return v;
    return Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  });
}
