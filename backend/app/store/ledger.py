"""가계부 저장소. 금액은 원 단위 정수."""
from collections.abc import Sequence
from dataclasses import asdict, dataclass
from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..db import Database
from ..models import LedgerEntry


@dataclass(frozen=True)
class Entry:
    day: date
    kind: str
    category: str
    amount: int
    who: str = ""
    memo: str = ""


@dataclass(frozen=True)
class StoredEntry(Entry):
    id: int = 0


def _view(row: LedgerEntry) -> StoredEntry:
    return StoredEntry(row.day, row.kind, row.category, row.amount, row.who, row.memo, row.id)


_NEWEST_FIRST = (LedgerEntry.day.desc(), LedgerEntry.id.desc())


class LedgerRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    def between(self, start: date, end: date) -> list[StoredEntry]:
        stmt = select(LedgerEntry).where(LedgerEntry.day >= start, LedgerEntry.day <= end)
        with self._db.session() as s:
            return [_view(r) for r in s.scalars(stmt.order_by(*_NEWEST_FIRST))]

    def all(self) -> list[StoredEntry]:
        with self._db.session() as s:
            return [_view(r) for r in s.scalars(select(LedgerEntry).order_by(*_NEWEST_FIRST))]

    def add(self, entry: Entry) -> StoredEntry:
        with self._db.session() as s:
            row = LedgerEntry(**asdict(entry))
            s.add(row)
            s.flush()
            return _view(row)

    def update(self, entry_id: int, entry: Entry) -> StoredEntry | None:
        with self._db.session() as s:
            row = s.get(LedgerEntry, entry_id)
            if row is None:
                return None
            for field, value in asdict(entry).items():
                setattr(row, field, value)
            s.flush()
            return _view(row)

    def delete(self, entry_id: int) -> bool:
        with self._db.session() as s:
            row = s.get(LedgerEntry, entry_id)
            if row is None:
                return False
            s.delete(row)
            return True

    @staticmethod
    def replace_all_in(s: Session, entries: Sequence[Entry]) -> int:
        """백업 불러오기: 가계부 전체를 바꾼다 (부르는 쪽의 트랜잭션 안에서)"""
        s.execute(delete(LedgerEntry))
        s.add_all(LedgerEntry(**asdict(e)) for e in entries)
        return len(entries)
