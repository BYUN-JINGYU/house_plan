"""시세 캐시 (DB). 무료 서버가 잠들었다 깨도 마지막 시세가 남는다."""
import logging
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from ..clock import as_utc
from ..db import Database
from ..models import QuoteRow
from .types import Quote

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class CachedQuote:
    quote: Quote
    fetched_at: datetime


class QuoteCache:
    def __init__(self, db: Database) -> None:
        self._db = db

    def get_many(self, keys: Sequence[str]) -> dict[str, CachedQuote]:
        if not keys:
            return {}
        with self._db.session() as s:
            rows = s.scalars(select(QuoteRow).where(QuoteRow.key.in_(list(keys))))
            return {r.key: CachedQuote(_quote(r), as_utc(r.fetched_at)) for r in rows}

    def put_many(self, quotes: Iterable[Quote], at: datetime) -> None:
        try:
            with self._db.session() as s:
                for q in quotes:
                    row = s.get(QuoteRow, q.key) or QuoteRow(key=q.key)
                    row.price, row.currency, row.as_of, row.source = q.price, q.currency, q.as_of, q.source
                    row.fetched_at = at
                    s.add(row)
        except IntegrityError:
            log.info("다른 요청이 같은 시세를 먼저 저장했어요")


def _quote(row: QuoteRow) -> Quote:
    return Quote(row.key, row.price, row.currency, row.as_of, row.source)
