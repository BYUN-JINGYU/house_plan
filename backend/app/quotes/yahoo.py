"""yfinance: 미국 주식, 국내 주식(.KS 코스피 → .KQ 코스닥), 원/달러 환율(KRW=X)

야후는 클라우드 서버 주소를 자주 막는다(429). 막히면 15분 쉬고 그동안은 다음 공급자로 넘긴다.
"""
import logging
import time
from collections.abc import Callable, Sequence
from typing import Any

from .frames import last_close
from .types import CURRENCY, Quote, Symbol

log = logging.getLogger(__name__)
COOLDOWN_SECONDS = 15 * 60
History = Callable[[str], Any]


def _yf_history(ticker: str) -> Any:
    import yfinance as yf  # 무거워서 쓸 때만 불러온다

    return yf.Ticker(ticker).history(period="5d", interval="1d", auto_adjust=False, raise_errors=True, timeout=10)


def yahoo_tickers(symbol: Symbol) -> list[str]:
    if symbol.market == "KR":
        return [f"{symbol.code}.KS", f"{symbol.code}.KQ"]
    if symbol.market == "FX":
        return ["KRW=X"]
    return [symbol.code.replace(".", "-")]  # BRK.B → BRK-B


def _rate_limited(err: Exception) -> bool:
    return "RateLimit" in type(err).__name__ or "429" in str(err)


class YahooProvider:
    name = "yahoo"

    def __init__(self, history: History | None = None, clock: Callable[[], float] = time.monotonic) -> None:
        self._history = history or _yf_history
        self._clock = clock
        self._paused_until = 0.0

    def supports(self, symbol: Symbol) -> bool:
        return True

    def fetch(self, symbols: Sequence[Symbol]) -> dict[str, Quote]:
        out: dict[str, Quote] = {}
        for symbol in symbols:
            if self._clock() < self._paused_until:
                break
            quote = self._one(symbol)
            if quote:
                out[symbol.key] = quote
        return out

    def _one(self, symbol: Symbol) -> Quote | None:
        for ticker in yahoo_tickers(symbol):
            try:
                frame = self._history(ticker)
            except Exception as err:  # 공급자 오류는 다음 후보로 넘긴다
                if _rate_limited(err):
                    self._paused_until = self._clock() + COOLDOWN_SECONDS
                    log.warning("야후가 요청을 막았어요(429). 15분 쉽니다.")
                    return None
                log.info("yahoo %s 실패: %s", ticker, err)
                continue
            got = last_close(frame, "Close")
            if got:
                return Quote(symbol.key, got[0], CURRENCY[symbol.market], got[1], self.name)
        return None
