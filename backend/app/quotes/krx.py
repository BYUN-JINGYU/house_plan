"""pykrx: 국내 주식 종가.

pykrx는 수정 종가를 네이버 일봉에서 받아 와서 KRX 로그인이 필요 없다.
"""
import logging
from collections.abc import Callable, Sequence
from datetime import date, timedelta
from typing import Any

from .frames import last_close
from .types import Quote, Symbol

log = logging.getLogger(__name__)
Ohlcv = Callable[[str, str, str], Any]


def _pykrx_ohlcv(start: str, end: str, code: str) -> Any:
    from pykrx import stock  # matplotlib까지 불러와서 무겁다

    # adjusted=True가 네이버 일봉 경로다 (False면 KRX 로그인이 필요한 경로)
    return stock.get_market_ohlcv_by_date(start, end, code, adjusted=True)


class PykrxProvider:
    name = "pykrx"

    def __init__(self, ohlcv: Ohlcv | None = None, today: Callable[[], date] = date.today) -> None:
        self._ohlcv = ohlcv or _pykrx_ohlcv
        self._today = today

    def supports(self, symbol: Symbol) -> bool:
        return symbol.market == "KR"

    def fetch(self, symbols: Sequence[Symbol]) -> dict[str, Quote]:
        end = self._today()
        start = end - timedelta(days=10)
        out: dict[str, Quote] = {}
        for symbol in symbols:
            try:
                frame = self._ohlcv(start.strftime("%Y%m%d"), end.strftime("%Y%m%d"), symbol.code)
            except Exception as err:  # 공급자 오류는 다음 공급자로 넘긴다
                log.info("pykrx %s 실패: %s", symbol.code, err)
                continue
            got = last_close(frame, "종가")
            if got:
                out[symbol.key] = Quote(symbol.key, got[0], "KRW", got[1], self.name)
        return out
