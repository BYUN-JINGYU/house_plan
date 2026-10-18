"""들어갈 때 비밀번호"""
import time

from fastapi.testclient import TestClient

from app.auth import router as auth_router
from app.auth.passwords import PasswordChecker
from app.auth.tokens import SessionTokens
from app.config import Settings
from app.main import create_app

from .conftest import PASSWORD

PROTECTED = ["/api/auth/me", "/api/docs", "/api/ledger?from=2026-10-01&to=2026-10-31", "/api/backup", "/api/quotes?symbols=US:AAPL"]


def test_everything_needs_login(client):
    for path in PROTECTED:
        assert client.get(path).status_code == 401, path


def test_health_is_open(client):
    assert client.get("/api/health").json() == {"ok": True}


def test_wrong_password_is_rejected(client):
    response = client.post("/api/auth/login", json={"password": "틀린 비밀번호"})
    assert response.status_code == 401
    assert client.get("/api/auth/me").status_code == 401


def test_login_sets_strict_httponly_cookie(client):
    response = client.post("/api/auth/login", json={"password": PASSWORD})
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=strict" in cookie
    assert client.get("/api/auth/me").json() == {"ok": True}


def test_logout_clears_session(authed):
    authed.post("/api/auth/logout")
    assert authed.get("/api/auth/me").status_code == 401


def test_too_many_failures_lock_that_client(client):
    for _ in range(5):
        client.post("/api/auth/login", json={"password": "x"})
    assert client.post("/api/auth/login", json={"password": PASSWORD}).status_code == 429
    other = {"X-Forwarded-For": "203.0.113.9"}
    assert client.post("/api/auth/login", json={"password": PASSWORD}, headers=other).status_code == 204


def test_crowded_door_is_slow_but_open(client, monkeypatch):
    monkeypatch.setattr(auth_router, "SLOW_SECONDS", 0.01)
    for i in range(20):
        client.post("/api/auth/login", json={"password": "x"}, headers={"X-Forwarded-For": f"198.51.100.{i}"})
    assert client.post("/api/auth/login", json={"password": PASSWORD}).status_code == 204


def test_forged_or_odd_cookie_is_rejected(client):
    for value in ("1700000000.abc.deadbeef", "1.a.é"):
        cookie = f"hp_session={value}".encode()
        assert client.get("/api/auth/me", headers={"Cookie": cookie}).status_code == 401


def test_session_is_renewed_while_used(client, settings):
    fingerprint = PasswordChecker(settings.app_password_hash).fingerprint
    old = SessionTokens(settings.session_secret, fingerprint, 30 * 86_400, clock=lambda: time.time() - 2 * 86_400).issue()
    response = client.get("/api/auth/me", headers={"Cookie": f"hp_session={old}"})
    assert response.status_code == 200 and "hp_session=" in response.headers.get("set-cookie", "")


def test_plain_password_setting_works(tmp_path):
    settings = Settings(database_url=f"sqlite:///{tmp_path / 'p.db'}", session_secret="k" * 64, app_password="평문-비밀번호-1234", cookie_secure=False)
    client = TestClient(create_app(settings))
    assert client.post("/api/auth/login", json={"password": "평문-비밀번호-1234"}).status_code == 204


def test_missing_or_short_password_refuses_login(tmp_path):
    for plain in ("", "short-pw"):
        settings = Settings(database_url=f"sqlite:///{tmp_path / 'n.db'}", session_secret="k" * 64, app_password=plain, cookie_secure=False)
        client = TestClient(create_app(settings))
        assert client.post("/api/auth/login", json={"password": plain or "아무거나"}).status_code == 503


def test_security_headers(client):
    headers = client.get("/api/health").headers
    assert "frame-ancestors 'none'" in headers["content-security-policy"]
    assert headers["cache-control"] == "no-store"
