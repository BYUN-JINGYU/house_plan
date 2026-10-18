"""요청 공통 의존성: 로그인 확인(쓰는 동안 쿠키 연장), 쿠키 쓰기, 접속한 곳 구분"""
from fastapi import Depends, HTTPException, Request, Response

from ..container import Container, get_container

COOKIE = "hp_session"


def set_session_cookie(response: Response, c: Container) -> None:
    response.set_cookie(
        COOKIE,
        c.tokens.issue(),
        max_age=c.tokens.max_age,
        httponly=True,
        secure=c.settings.cookie_secure,
        samesite="strict",
        path="/",
    )


def require_session(request: Request, response: Response, c: Container = Depends(get_container)) -> None:
    token = request.cookies.get(COOKIE)
    if not c.tokens.valid(token):
        raise HTTPException(status_code=401, detail="로그인이 필요해요")
    if c.tokens.should_renew(token):
        set_session_cookie(response, c)


def client_key(request: Request) -> str:
    """시도 제한용 구분값. Render는 X-Forwarded-For 첫 값을 실제 접속 주소로 넣는다."""
    first = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if first:
        return first
    return request.client.host if request.client else "unknown"
