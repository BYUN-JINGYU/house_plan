"""여러 공급자를 순서대로 쓴다. 앞에서 못 받은 종목만 다음 공급자에게 넘긴다.

공급자마다 시간 제한을 둔다: pykrx는 내부 요청에 제한이 없어서, 멈추면 다음 공급자로 넘어간다.
"""
import logging
from collections.abc import Sequence
from concurrent.futures import Executor, ThreadPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeout

from .types import Quote, QuoteProvider, Symbol

log = logging.getLogger(__name__)


class FallbackChain:
    name = "chain"

    def __init__(self, providers: Sequence[QuoteProvider], timeout: float = 15.0, pool: Executor | None = None) -> None:
        self._providers = list(providers)
        self._timeout = timeout
        self._pool = pool or ThreadPoolExecutor(max_workers=4, thread_name_prefix="quote")

    def supports(self, symbol: Symbol) -> bool:
        return any(p.supports(symbol) for p in self._providers)

    def fetch(self, symbols: Sequence[Symbol]) -> dict[str, Quote]:
        out: dict[str, Quote] = {}
        left = list(symbols)
        for provider in self._providers:
            todo = [s for s in left if provider.supports(s)]
            if not todo:
                continue
            out.update(self._ask(provider, todo))
            left = [s for s in left if s.key not in out]
            if not left:
                break
        return out

    def _ask(self, provider: QuoteProvider, todo: list[Symbol]) -> dict[str, Quote]:
        future = self._pool.submit(provider.fetch, todo)
        try:
            return future.result(timeout=self._timeout)
        except FutureTimeout:
            log.warning("%s 공급자가 %s초 안에 답하지 않아 넘어가요", provider.name, self._timeout)
        except Exception:  # 공급자 하나가 통째로 죽어도 다음으로
            log.exception("%s 공급자 오류", provider.name)
        return {}
