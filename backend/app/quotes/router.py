"""시세 API: 화면용 조회, 자동 갱신(GitHub Actions)용 새로고침"""
import hmac
from datetime import date, datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel

from ..auth.deps import require_session
from ..clock import utcnow
from ..container import Container, get_container
from .cache import CachedQuote
from .holdings import symbols_in_people
from .types import Symbol

router = APIRouter(prefix="/api/quotes", tags=["quotes"])
MAX_SYMBOLS = 60


class QuoteOut(BaseModel):
    price: float
    currency: str
    asOf: date
    source: str
    fetchedAt: datetime
    stale: bool


class QuotesOut(BaseModel):
    quotes: dict[str, QuoteOut]
    missing: list[str]


def _parse(text: str) -> list[Symbol]:
    keys = [k for k in text.split(",") if k.strip()]
    if len(keys) > MAX_SYMBOLS:
        raise HTTPException(status_code=400, detail="종목이 너무 많아요")
    try:
        return [Symbol.parse(k) for k in keys]
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from None


def _out(got: dict[str, CachedQuote], missing: list[str], c: Container) -> QuotesOut:
    now = utcnow()
    quotes = {
        key: QuoteOut(
            price=v.quote.price, currency=v.quote.currency, asOf=v.quote.as_of, source=v.quote.source,
            fetchedAt=v.fetched_at, stale=now - v.fetched_at > c.quotes.ttl,
        )
        for key, v in got.items()
    }
    return QuotesOut(quotes=quotes, missing=missing)


@router.get("", dependencies=[Depends(require_session)])
def get_quotes(
    symbols: str = Query(default="", max_length=1200),
    force: bool = False,
    c: Container = Depends(get_container),
) -> QuotesOut:
    got, missing = c.quotes.get(_parse(symbols), force=force)
    return _out(got, missing, c)


@router.post("/refresh")
def refresh_quotes(authorization: str = Header(default=""), c: Container = Depends(get_container)) -> dict[str, int]:
    """공개 저장소의 Actions 기록에 남으므로 종목 이름 없이 개수만 돌려준다"""
    token = c.settings.cron_token
    if not token or not hmac.compare_digest(authorization.encode(), f"Bearer {token}".encode()):
        raise HTTPException(status_code=401, detail="토큰이 달라요")
    people = c.docs.get("people")
    got, missing = c.quotes.get(symbols_in_people(people.data if people else None), force=True)
    return {"quotes": len(got), "missing": len(missing)}
