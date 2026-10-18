"""Frankfurter(유럽중앙은행 기준환율): 원/달러 예비용. 평일 하루 한 번 바뀐다."""
import logging
from collections.abc import Callable, Sequence
from datetime import date

from .types import USDKRW_KEY, Quote, Symbol

log = logging.getLogger(__name__)
URL = "https://api.frankfurter.dev/v1/latest"
GetJson = Callable[[str, dict[str, str]], dict]


def _get_json(url: str, params: dict[str, str]) -> dict:
    import httpx

    response = httpx.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()


class FrankfurterProvider:
    name = "ecb"

    def __init__(self, get_json: GetJson | None = None) -> None:
        self._get_json = get_json or _get_json

    def supports(self, symbol: Symbol) -> bool:
        return symbol.key == USDKRW_KEY

    def fetch(self, symbols: Sequence[Symbol]) -> dict[str, Quote]:
        if not any(s.key == USDKRW_KEY for s in symbols):
            return {}
        try:
            data = self._get_json(URL, {"base": "USD", "symbols": "KRW"})
            rate = float(data["rates"]["KRW"])
            day = date.fromisoformat(data["date"])
        except Exception as err:  # 예비 공급자라 실패해도 조용히 넘긴다
            log.info("frankfurter 실패: %s", err)
            return {}
        return {USDKRW_KEY: Quote(USDKRW_KEY, rate, "KRW", day, self.name)}
