"""시세: 캐시, 예비 공급자, 자동 갱신 토큰, 공급자 어댑터"""
import time
from datetime import date

import pandas as pd

from app.quotes.chain import FallbackChain
from app.quotes.frankfurter import FrankfurterProvider
from app.quotes.krx import PykrxProvider
from app.quotes.types import Symbol
from app.quotes.yahoo import YahooProvider

from .conftest import CRON, FakeProvider

KEYS = "KR:005930,US:AAPL,FX:USDKRW"


def test_quotes_are_cached_within_ttl(authed, provider):
    first = authed.get("/api/quotes", params={"symbols": KEYS}).json()
    assert first["quotes"]["US:AAPL"]["price"] == 230.5 and first["missing"] == []
    authed.get("/api/quotes", params={"symbols": KEYS})
    assert len(provider.calls) == 1


def test_force_respects_min_gap(authed, provider):
    authed.get("/api/quotes", params={"symbols": KEYS})
    authed.get("/api/quotes", params={"symbols": KEYS, "force": "true"})
    assert len(provider.calls) == 1


def test_unknown_symbol_is_reported_missing(authed):
    body = authed.get("/api/quotes", params={"symbols": "US:ZZZZ"}).json()
    assert body == {"quotes": {}, "missing": ["US:ZZZZ"]}


def test_bad_symbols_are_400(authed):
    assert authed.get("/api/quotes", params={"symbols": "KR:가나다"}).status_code == 400
    assert authed.get("/api/quotes", params={"symbols": "XX:1"}).status_code == 400


def test_refresh_needs_cron_token(client):
    assert client.post("/api/quotes/refresh").status_code == 401
    assert client.post("/api/quotes/refresh", headers={"Authorization": "Bearer wrong"}).status_code == 401


def test_refresh_reads_holdings_from_people(authed, provider):
    people = {"a": {"brokers": [{"holdings": [{"market": "KR", "code": "005930"}, {"market": "US", "code": "aapl"}]}]}}
    authed.put("/api/docs/people", json={"data": people, "version": 0})
    response = authed.post("/api/quotes/refresh", headers={"Authorization": f"Bearer {CRON}"})
    assert response.json() == {"quotes": 3, "missing": 0}
    assert sorted(provider.calls[0]) == ["FX:USDKRW", "KR:005930", "US:AAPL"]


def test_chain_falls_back_per_symbol():
    first = FakeProvider({"KR:005930": 1.0})
    second = FakeProvider({"KR:005930": 2.0, "US:AAPL": 3.0})
    got = FallbackChain([first, second]).fetch([Symbol("KR", "005930"), Symbol("US", "AAPL")])
    assert got["KR:005930"].price == 1.0 and got["US:AAPL"].price == 3.0
    assert second.calls == [["US:AAPL"]]


def test_chain_skips_a_stuck_provider():
    class Stuck(FakeProvider):
        def fetch(self, symbols):
            time.sleep(1)
            return super().fetch(symbols)

    backup = FakeProvider({"KR:005930": 2.0})
    got = FallbackChain([Stuck({"KR:005930": 1.0}), backup], timeout=0.1).fetch([Symbol("KR", "005930")])
    assert got["KR:005930"].price == 2.0


def _frame(column: str, values: list[float]) -> pd.DataFrame:
    index = pd.to_datetime(["2026-10-15", "2026-10-16"][: len(values)])
    return pd.DataFrame({column: values}, index=index)


def test_yahoo_tries_kosdaq_after_kospi():
    asked: list[str] = []

    def history(ticker: str):
        asked.append(ticker)
        return _frame("Close", [10_000.0, 10_500.0]) if ticker.endswith(".KQ") else pd.DataFrame()

    quote = YahooProvider(history=history).fetch([Symbol("KR", "035720")])["KR:035720"]
    assert asked == ["035720.KS", "035720.KQ"]
    assert quote.price == 10_500.0 and quote.as_of == date(2026, 10, 16)


def test_yahoo_pauses_after_rate_limit():
    class YFRateLimitError(Exception):
        pass

    calls: list[str] = []

    def history(ticker: str):
        calls.append(ticker)
        raise YFRateLimitError("Too Many Requests")

    yahoo = YahooProvider(history=history, clock=lambda: 0.0)
    assert yahoo.fetch([Symbol("US", "AAPL"), Symbol("US", "MSFT")]) == {}
    assert calls == ["AAPL"]


def test_pykrx_reads_last_close():
    provider = PykrxProvider(ohlcv=lambda s, e, code: _frame("종가", [70_000.0, 71_200.0]), today=lambda: date(2026, 10, 16))
    assert provider.fetch([Symbol("KR", "005930")])["KR:005930"].price == 71_200.0


def test_frankfurter_parses_rate():
    provider = FrankfurterProvider(get_json=lambda url, params: {"date": "2026-10-16", "rates": {"KRW": 1332.1}})
    quote = provider.fetch([Symbol("FX", "USDKRW")])["FX:USDKRW"]
    assert quote.price == 1332.1 and quote.source == "ecb"
