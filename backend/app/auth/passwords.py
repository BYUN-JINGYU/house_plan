"""비밀번호 해시(PBKDF2-SHA256)와 확인. 표준 라이브러리만 쓴다."""
import base64
import hashlib
import hmac
import secrets

ALGO = "pbkdf2_sha256"
ITERATIONS = 200_000
MIN_LENGTH = 12


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def hash_password(password: str, *, iterations: int = ITERATIONS, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return f"{ALGO}${iterations}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algo, iterations, salt, digest = encoded.split("$")
        expected = _unb64(digest)
        calc = hashlib.pbkdf2_hmac("sha256", password.encode(), _unb64(salt), int(iterations))
    except ValueError:
        return False
    return algo == ALGO and hmac.compare_digest(calc, expected)


class PasswordChecker:
    """설정에 해시가 있으면 해시로, 없으면 평문 환경 변수로 확인한다"""

    def __init__(self, hashed: str = "", plain: str = "") -> None:
        self._hashed = hashed.strip()
        self._plain = plain

    @property
    def problem(self) -> str:
        """로그인을 받을 수 없는 이유 (없으면 빈 문자열)"""
        if self._hashed:
            return ""
        if not self._plain:
            return "서버에 비밀번호가 아직 설정되지 않았어요"
        if len(self._plain) < MIN_LENGTH:
            return f"서버 비밀번호를 {MIN_LENGTH}자 이상으로 바꿔 주세요"
        return ""

    @property
    def fingerprint(self) -> str:
        """비밀번호가 바뀌면 달라지는 값. 세션 서명 키에 섞는다."""
        return hashlib.sha256((self._hashed or self._plain).encode()).hexdigest()

    def check(self, password: str) -> bool:
        if self.problem:
            return False
        if self._hashed:
            return verify_password(password, self._hashed)
        return hmac.compare_digest(password.encode(), self._plain.encode())
