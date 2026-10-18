"""부품 조립(의존성 주입). 라우터는 여기서 만든 부품만 쓰고, 테스트는 부품을 바꿔 끼운다."""
import logging
import secrets
from dataclasses import dataclass
from datetime import timedelta

from fastapi import Request

from .auth.guard import LoginGuard
from .auth.passwords import PasswordChecker
from .auth.tokens import SessionTokens
from .config import Settings
from .db import Database
from .quotes.cache import QuoteCache
from .quotes.chain import FallbackChain
from .quotes.frankfurter import FrankfurterProvider
from .quotes.krx import PykrxProvider
from .quotes.service import QuoteService
from .quotes.types import QuoteProvider
from .quotes.yahoo import YahooProvider
from .store.documents import DocumentRepository
from .store.ledger import LedgerRepository

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class Container:
    settings: Settings
    db: Database
    docs: DocumentRepository
    ledger: LedgerRepository
    quotes: QuoteService
    passwords: PasswordChecker
    tokens: SessionTokens
    guard: LoginGuard


def default_provider() -> QuoteProvider:
    """국내: pykrx → 야후, 미국: 야후, 환율: 야후 → 유럽중앙은행"""
    return FallbackChain([PykrxProvider(), YahooProvider(), FrankfurterProvider()])


def build_container(settings: Settings, provider: QuoteProvider | None = None) -> Container:
    db = Database(settings.database_url)
    passwords = PasswordChecker(settings.app_password_hash, settings.app_password)
    if passwords.problem:
        log.error(passwords.problem)
    secret = settings.session_secret
    if not secret:
        log.warning("SESSION_SECRET이 없어 임시 값을 써요. 서버가 다시 켜지면 다시 로그인해야 해요.")
        secret = secrets.token_hex(32)
    quotes = QuoteService(
        QuoteCache(db),
        provider or default_provider(),
        ttl=timedelta(minutes=settings.quote_ttl_minutes),
        min_gap=timedelta(seconds=settings.quote_min_gap_seconds),
    )
    return Container(
        settings=settings,
        db=db,
        docs=DocumentRepository(db),
        ledger=LedgerRepository(db),
        quotes=quotes,
        passwords=passwords,
        tokens=SessionTokens(secret, passwords.fingerprint, settings.session_days * 86_400),
        guard=LoginGuard(settings.login_max_per_client, settings.login_max_overall, settings.login_window_seconds),
    )


def get_container(request: Request) -> Container:
    return request.app.state.container
