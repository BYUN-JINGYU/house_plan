"""로그인·로그아웃·확인 API"""
import asyncio
import math

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from ..container import Container, get_container
from .deps import COOKIE, client_key, require_session, set_session_cookie

router = APIRouter(prefix="/api/auth", tags=["auth"])
SLOW_SECONDS = 2.0


class LoginBody(BaseModel):
    password: str = Field(min_length=1, max_length=200)


async def _check(c: Container, password: str) -> bool:
    """비밀번호 해시는 CPU를 쓰므로 스레드에서. 전체 시도가 많으면 한 줄로 천천히."""
    if not c.guard.crowded():
        return await run_in_threadpool(c.passwords.check, password)
    async with c.guard.slow_lane:
        await asyncio.sleep(SLOW_SECONDS)
        return await run_in_threadpool(c.passwords.check, password)


@router.post("/login", status_code=204)
async def login(body: LoginBody, request: Request, response: Response, c: Container = Depends(get_container)) -> None:
    if c.passwords.problem:
        raise HTTPException(status_code=503, detail=c.passwords.problem)
    who = client_key(request)
    wait = c.guard.attempt(who)
    if wait > 0:
        raise HTTPException(status_code=429, detail=f"너무 많이 틀렸어요. {math.ceil(wait / 60)}분 뒤에 다시 해 주세요")
    if not await _check(c, body.password):
        raise HTTPException(status_code=401, detail="비밀번호가 달라요")
    c.guard.succeeded(who)
    set_session_cookie(response, c)


@router.post("/logout", status_code=204)
def logout(response: Response, c: Container = Depends(get_container)) -> None:
    response.delete_cookie(COOKIE, path="/", secure=c.settings.cookie_secure, httponly=True, samesite="strict")


@router.get("/me", dependencies=[Depends(require_session)])
def me(c: Container = Depends(get_container)) -> dict[str, bool]:
    """open이면 화면이 나가기 버튼을 숨긴다"""
    return {"ok": True, "open": not c.settings.require_login}
