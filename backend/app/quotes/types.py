"""시세 공통 타입과 공급자 약속(인터페이스)"""
import re
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date
from typing import Literal, Protocol

Market = Literal["KR", "US", "FX"]
CURRENCY = {"KR": "KRW", "US": "USD", "FX": "KRW"}
USDKRW_KEY = "FX:USDKRW"
_RULES = {
    "KR": re.compile(r"^[0-9A-Z]{6}$"),
    "US": re.compile(r"^[A-Z][A-Z0-9.\-]{0,9}$"),
    "FX": re.compile(r"^USDKRW$"),
}


@dataclass(frozen=True)
class Symbol:
    """KR:005930 (국내 종목코드), US:AAPL (미국 티커), FX:USDKRW (원/달러)"""

    market: Market
    code: str

    @property
    def key(self) -> str:
        return f"{self.market}:{self.code}"

    @classmethod
    def parse(cls, key: str) -> "Symbol":
        market, _, code = key.strip().upper().partition(":")
        rule = _RULES.get(market)
        if rule is None or not rule.match(code):
            raise ValueError(f"종목 표시가 이상해요: {key.strip()}")
        return cls(market, code)  # type: ignore[arg-type]


@dataclass(frozen=True)
class Quote:
    key: str
    price: float
    currency: str
    as_of: date
    source: str


class QuoteProvider(Protocol):
    name: str

    def supports(self, symbol: Symbol) -> bool: ...

    def fetch(self, symbols: Sequence[Symbol]) -> dict[str, Quote]:
        """받은 종목만 돌려준다. 못 받은 종목은 결과에서 빠진다."""
        ...
