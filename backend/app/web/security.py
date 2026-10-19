"""모든 응답에 붙이는 보안 헤더와 캐시 규칙"""
from starlette.types import ASGIApp, Message, Receive, Scope, Send

CSP = "; ".join([
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
])
BASE = {
    b"content-security-policy": CSP.encode(),
    b"x-content-type-options": b"nosniff",
    b"referrer-policy": b"no-referrer",
    b"x-frame-options": b"DENY",
    b"x-robots-tag": b"noindex, nofollow",  # 검색엔진에 안 뜨게
    b"permissions-policy": b"camera=(), microphone=(), geolocation=()",
}


def _cache_rule(path: str) -> bytes:
    if path.startswith("/api/"):
        return b"no-store"
    if path.startswith("/assets/"):
        return b"public, max-age=31536000, immutable"  # 파일 이름에 해시가 붙어 있다
    return b"no-cache"


class SecurityHeaders:
    """순수 ASGI 미들웨어 (응답 본문을 건드리지 않는다)"""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        extra = {**BASE, b"cache-control": _cache_rule(scope.get("path", ""))}

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = [(k, v) for k, v in message.get("headers", []) if k.lower() not in extra]
                message["headers"] = headers + list(extra.items())
            await send(message)

        await self.app(scope, receive, send_with_headers)
