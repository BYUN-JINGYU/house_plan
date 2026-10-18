"""시세 조회: 캐시가 신선하면 캐시, 아니면 공급자에게 새로 받아 저장한다.

동시에 여러 요청이 와도 공급자에는 한 번만 묻도록 잠근다 (야후 429 예방).
다른 요청이 너무 오래 받고 있으면 기다리지 않고 캐시만 돌려준다.
"""
import threading
from collections.abc import Callable, Sequence
from datetime import datetime, timedelta

from ..clock import utcnow
from .cache import CachedQuote, QuoteCache
from .types import QuoteProvider, Symbol

LOCK_WAIT_SECONDS = 60


class QuoteService:
    def __init__(
        self,
        cache: QuoteCache,
        provider: QuoteProvider,
        ttl: timedelta,
        min_gap: timedelta,
        clock: Callable[[], datetime] = utcnow,
    ) -> None:
        self._cache = cache
        self._provider = provider
        self._ttl = ttl
        self._min_gap = min_gap
        self._clock = clock
        self._lock = threading.Lock()

    @property
    def ttl(self) -> timedelta:
        return self._ttl

    def get(self, symbols: Sequence[Symbol], force: bool = False) -> tuple[dict[str, CachedQuote], list[str]]:
        """(받은 시세, 못 받은 종목 키). force여도 min_gap 안에 받은 것은 다시 묻지 않는다."""
        unique = list({s.key: s for s in symbols}.values())
        keys = [s.key for s in unique]
        if not self._lock.acquire(timeout=LOCK_WAIT_SECONDS):
            cached = self._cache.get_many(keys)
            return cached, [k for k in keys if k not in cached]
        try:
            cached = self._refresh(unique, force)
        finally:
            self._lock.release()
        return cached, [k for k in keys if k not in cached]

    def _refresh(self, unique: list[Symbol], force: bool) -> dict[str, CachedQuote]:
        now = self._clock()
        cached = self._cache.get_many([s.key for s in unique])
        limit = self._min_gap if force else self._ttl
        due = [s for s in unique if s.key not in cached or now - cached[s.key].fetched_at >= limit]
        fresh = self._provider.fetch(due) if due else {}
        if fresh:
            self._cache.put_many(fresh.values(), now)
            cached.update({key: CachedQuote(q, now) for key, q in fresh.items()})
        return cached
