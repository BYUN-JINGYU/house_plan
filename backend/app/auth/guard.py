"""비밀번호 시도 제한. 접속한 곳별로는 막고, 전체로는 느리게 한다.

- 시도를 확인하기 전에 먼저 기록해서, 동시에 여러 번 보내도 한도를 못 넘는다.
- 전체 실패가 많아지면 막지 않고 한 줄로 천천히 받는다 (누가 문을 잠가 버리는 일을 막으려고).
서버 한 대 메모리 기준이라 재시작하면 초기화된다 (무료 서버 1대 가정).
"""
import asyncio
import threading
import time
from collections import deque
from collections.abc import Callable


class _Window:
    """최근 seconds초 안의 기록 수를 센다"""

    def __init__(self, limit: int, seconds: float, clock: Callable[[], float]) -> None:
        self.limit = limit
        self._seconds = seconds
        self._clock = clock
        self._hits: dict[str, deque[float]] = {}

    def count(self, key: str) -> int:
        return len(self._recent(key))

    def wait(self, key: str) -> float:
        hits = self._recent(key)
        if len(hits) < self.limit:
            return 0.0
        return max(0.0, hits[0] + self._seconds - self._clock())

    def hit(self, key: str) -> None:
        self._hits.setdefault(key, deque()).append(self._clock())

    def undo(self, key: str) -> None:
        hits = self._hits.get(key)
        if hits:
            hits.pop()

    def clear(self, key: str) -> None:
        self._hits.pop(key, None)

    def _recent(self, key: str) -> deque[float]:
        hits = self._hits.get(key, deque())
        edge = self._clock() - self._seconds
        while hits and hits[0] <= edge:
            hits.popleft()
        if not hits:
            self._hits.pop(key, None)
        return hits


class LoginGuard:
    def __init__(
        self,
        per_client: int,
        overall: int,
        window_seconds: float,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._client = _Window(per_client, window_seconds, clock)
        self._all = _Window(overall, window_seconds, clock)
        self._lock = threading.Lock()
        self.slow_lane = asyncio.Lock()

    def attempt(self, client: str) -> float:
        """막혀 있으면 기다릴 초, 아니면 시도를 먼저 기록하고 0"""
        with self._lock:
            wait = self._client.wait(client)
            if wait > 0:
                return wait
            self._client.hit(client)
            self._all.hit("*")
            return 0.0

    def crowded(self) -> bool:
        """전체 시도가 많으면 한 줄로 천천히 받는다"""
        with self._lock:
            return self._all.count("*") >= self._all.limit

    def succeeded(self, client: str) -> None:
        with self._lock:
            self._client.clear(client)
            self._all.undo("*")
