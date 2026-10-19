"""DB 연결. 무료 Postgres(Neon 등)와 로컬 SQLite를 같은 코드로 쓴다."""
from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


def normalize_url(url: str) -> str:
    """postgres:// 주소를 psycopg 3 드라이버 주소로 바꾼다"""
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def make_engine(url: str) -> Engine:
    url = normalize_url(url)
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    # 무료 DB는 쉬면 연결을 끊으므로 쓰기 전에 확인하고 5분마다 새로 맺는다.
    # prepare_threshold=None: 연결 풀러(PgBouncer) 주소를 써도 준비된 문장 오류가 안 나게
    return create_engine(
        url, pool_pre_ping=True, pool_recycle=300, pool_size=3, max_overflow=2,
        connect_args={"prepare_threshold": None},
    )


class Database:
    def __init__(self, url: str) -> None:
        self.engine = make_engine(url)
        self._sessions = sessionmaker(self.engine, expire_on_commit=False)

    def create_tables(self) -> None:
        from . import models  # noqa: F401  테이블 등록용

        Base.metadata.create_all(self.engine)

    @contextmanager
    def session(self) -> Iterator[Session]:
        """끝나면 커밋, 예외가 나면 롤백"""
        with self._sessions() as session, session.begin():
            yield session
