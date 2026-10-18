"""로그인 쿠키에 넣는 서명 토큰: 발급시각.난수.서명

- 서명 키에 비밀번호 지문을 섞어서, 비밀번호를 바꾸면 모든 기기가 다시 로그인한다.
- 쓰는 동안에는 하루마다 새로 발급해서, 마지막으로 쓴 날부터 max_age 동안 유지된다.
"""
import hashlib
import hmac
import secrets
import time
from collections.abc import Callable

RENEW_AFTER_SECONDS = 86_400


class SessionTokens:
    def __init__(
        self,
        secret: str,
        password_fingerprint: str,
        max_age_seconds: int,
        clock: Callable[[], float] = time.time,
    ) -> None:
        self._key = hashlib.sha256(f"{secret}|{password_fingerprint}".encode()).digest()
        self._max_age = max_age_seconds
        self._clock = clock

    @property
    def max_age(self) -> int:
        return self._max_age

    def issue(self) -> str:
        body = f"{int(self._clock())}.{secrets.token_urlsafe(9)}"
        return f"{body}.{self._sign(body)}"

    def valid(self, token: str | None) -> bool:
        age = self._age(token)
        return age is not None and 0 <= age <= self._max_age

    def should_renew(self, token: str | None) -> bool:
        age = self._age(token)
        return age is not None and age > RENEW_AFTER_SECONDS

    def _age(self, token: str | None) -> float | None:
        """서명이 맞으면 발급 뒤 지난 초, 아니면 None"""
        if not token or not token.isascii() or token.count(".") != 2:
            return None
        body, signature = token.rsplit(".", 1)
        if not hmac.compare_digest(signature.encode(), self._sign(body).encode()):
            return None
        issued = body.split(".", 1)[0]
        return self._clock() - int(issued) if issued.isdigit() else None

    def _sign(self, body: str) -> str:
        return hmac.new(self._key, body.encode(), hashlib.sha256).hexdigest()
