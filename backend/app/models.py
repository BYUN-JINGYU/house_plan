"""DB 테이블: 문서(계획·사람·할 일), 가계부, 시세 캐시"""
from datetime import date, datetime

from sqlalchemy import JSON, BigInteger, Date, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Document(Base):
    """화면 하나가 쓰는 JSON 한 덩어리. version으로 동시 수정 충돌을 막는다."""

    __tablename__ = "documents"
    key: Mapped[str] = mapped_column(String(20), primary_key=True)
    data: Mapped[dict] = mapped_column(JSON)
    version: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class LedgerEntry(Base):
    """가계부 한 줄. 금액은 원 단위 정수."""

    __tablename__ = "ledger_entries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    kind: Mapped[str] = mapped_column(String(3))
    category: Mapped[str] = mapped_column(String(20))
    amount: Mapped[int] = mapped_column(BigInteger)
    who: Mapped[str] = mapped_column(String(2), default="")
    memo: Mapped[str] = mapped_column(String(60), default="")


class QuoteRow(Base):
    """마지막으로 받은 시세. 서버가 잠들었다 깨도 남는다."""

    __tablename__ = "quotes"
    key: Mapped[str] = mapped_column(String(24), primary_key=True)
    price: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(3))
    as_of: Mapped[date] = mapped_column(Date)
    source: Mapped[str] = mapped_column(String(16))
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
