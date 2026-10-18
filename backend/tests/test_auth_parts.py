"""비밀번호 해시, 세션 토큰, 시도 제한 단위 테스트"""
from app.auth.guard import LoginGuard
from app.auth.passwords import PasswordChecker, hash_password, verify_password
from app.auth.tokens import SessionTokens


def test_hash_roundtrip_and_salt():
    a = hash_password("비밀", iterations=1_000)
    b = hash_password("비밀", iterations=1_000)
    assert a != b
    assert verify_password("비밀", a) and not verify_password("비밀2", a)
    assert not verify_password("비밀", "망가진값")


def test_fingerprint_changes_with_password():
    assert PasswordChecker(plain="a" * 12).fingerprint != PasswordChecker(plain="b" * 12).fingerprint


def test_short_plain_password_is_refused():
    short = PasswordChecker(plain="short-pw")
    assert short.problem and not short.check("short-pw")
    assert PasswordChecker().problem


def test_token_expires_and_rejects_tampering():
    now = [1_000_000.0]
    tokens = SessionTokens("secret", "fp", max_age_seconds=60, clock=lambda: now[0])
    token = tokens.issue()
    assert tokens.valid(token)
    assert not tokens.valid(token[:-1] + ("0" if token[-1] != "0" else "1"))
    assert not tokens.valid(token[:-1] + "é")
    now[0] += 61
    assert not tokens.valid(token)


def test_token_renews_after_a_day():
    now = [1_000_000.0]
    tokens = SessionTokens("secret", "fp", max_age_seconds=30 * 86_400, clock=lambda: now[0])
    token = tokens.issue()
    assert not tokens.should_renew(token)
    now[0] += 2 * 86_400
    assert tokens.valid(token) and tokens.should_renew(token)


def test_token_from_other_password_is_invalid():
    issued = SessionTokens("secret", "old-password", 60).issue()
    assert not SessionTokens("secret", "new-password", 60).valid(issued)


def test_attempts_are_counted_before_checking():
    now = [0.0]
    guard = LoginGuard(per_client=2, overall=10, window_seconds=100, clock=lambda: now[0])
    assert guard.attempt("ip1") == 0 and guard.attempt("ip1") == 0
    assert guard.attempt("ip1") > 0
    assert guard.attempt("ip2") == 0
    now[0] = 101
    assert guard.attempt("ip1") == 0


def test_success_clears_the_client():
    guard = LoginGuard(per_client=2, overall=10, window_seconds=100, clock=lambda: 0.0)
    guard.attempt("ip1")
    guard.succeeded("ip1")
    assert guard.attempt("ip1") == 0 and guard.attempt("ip1") == 0


def test_many_addresses_make_it_slow_not_locked():
    guard = LoginGuard(per_client=5, overall=3, window_seconds=100, clock=lambda: 0.0)
    for ip in ("a", "b", "c"):
        guard.attempt(ip)
    assert guard.crowded()
    assert guard.attempt("d") == 0
