"""테스트 공통: 임시 SQLite, 가짜 시세 공급자, 로그인한 클라이언트"""
from collections.abc import Sequence
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.auth.passwords import hash_password
from app.config import Settings
from app.main import create_app
from app.quotes.types import CURRENCY, Quote, Symbol

PASSWORD = "열려라-참깨-2027"
CRON = "cron-token-for-tests"


class FakeProvider:
    name = "fake"

    def __init__(self, prices: dict[str, float]) -> None:
        self.prices = prices
        self.calls: list[list[str]] = []

    def supports(self, symbol: Symbol) -> bool:
        return True

    def fetch(self, symbols: Sequence[Symbol]) -> dict[str, Quote]:
        self.calls.append([s.key for s in symbols])
        return {
            s.key: Quote(s.key, self.prices[s.key], CURRENCY[s.market], date(2026, 10, 16), self.name)
            for s in symbols
            if s.key in self.prices
        }


@pytest.fixture
def settings(tmp_path) -> Settings:
    return Settings(
        database_url=f"sqlite:///{tmp_path / 'test.db'}",
        session_secret="s" * 64,
        app_password_hash=hash_password(PASSWORD, iterations=1_000),
        cron_token=CRON,
        cookie_secure=False,
        static_dir="",
    )


@pytest.fixture
def provider() -> FakeProvider:
    return FakeProvider({"KR:005930": 61_000.0, "US:AAPL": 230.5, "FX:USDKRW": 1332.1})


@pytest.fixture
def client(settings, provider) -> TestClient:
    return TestClient(create_app(settings, provider=provider))


@pytest.fixture
def authed(client) -> TestClient:
    response = client.post("/api/auth/login", json={"password": PASSWORD})
    assert response.status_code == 204
    return client
