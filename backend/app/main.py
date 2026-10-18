"""앱 만들기: 설정 → 부품 → 라우터 → 화면 파일

실행: uvicorn app.main:create_app --factory
"""
import logging

from fastapi import FastAPI

from .auth.router import router as auth_router
from .config import Settings
from .container import build_container
from .quotes.router import router as quotes_router
from .quotes.types import QuoteProvider
from .store.backup_router import router as backup_router
from .store.docs_router import router as docs_router
from .store.ledger_router import router as ledger_router
from .web.health import router as health_router
from .web.security import SecurityHeaders
from .web.spa import mount_spa

ROUTERS = (health_router, auth_router, docs_router, ledger_router, backup_router, quotes_router)


def create_app(settings: Settings | None = None, provider: QuoteProvider | None = None) -> FastAPI:
    logging.basicConfig(level=logging.INFO)
    settings = settings or Settings()
    container = build_container(settings, provider)
    container.db.create_tables()
    app = FastAPI(title="houseplan", docs_url=None, redoc_url=None, openapi_url=None)
    app.state.container = container
    app.add_middleware(SecurityHeaders)
    for router in ROUTERS:
        app.include_router(router)
    mount_spa(app, settings.static_dir)
    return app
