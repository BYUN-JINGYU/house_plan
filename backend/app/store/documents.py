"""문서 저장소: 키 하나에 JSON 하나. 마지막으로 본 버전이 아니면 덮어쓰지 않는다."""
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..clock import as_utc, utcnow
from ..db import Database
from ..models import Document

DOC_KEYS = ("plan", "people", "checks")


@dataclass(frozen=True)
class StoredDoc:
    key: str
    data: dict
    version: int
    updated_at: datetime


class VersionConflict(Exception):
    def __init__(self, current: StoredDoc | None) -> None:
        super().__init__("version conflict")
        self.current = current


def _view(row: Document) -> StoredDoc:
    return StoredDoc(row.key, row.data, row.version, as_utc(row.updated_at))


class DocumentRepository:
    def __init__(self, db: Database, clock: Callable[[], datetime] = utcnow) -> None:
        self._db = db
        self._clock = clock

    def all(self) -> dict[str, StoredDoc]:
        with self._db.session() as s:
            return {row.key: _view(row) for row in s.scalars(select(Document))}

    def get(self, key: str) -> StoredDoc | None:
        with self._db.session() as s:
            row = s.get(Document, key)
            return _view(row) if row else None

    def save(self, key: str, data: dict, expected_version: int) -> StoredDoc:
        """expected_version: 화면이 마지막으로 받은 버전 (처음 저장이면 0)"""
        try:
            with self._db.session() as s:
                row = s.get(Document, key, with_for_update=True)
                current = row.version if row else 0
                if current != expected_version:
                    raise VersionConflict(_view(row) if row else None)
                return _view(self._write(s, row, key, data))
        except IntegrityError:
            # 처음 저장이 동시에 두 번 들어온 경우
            raise VersionConflict(self.get(key)) from None

    def replace_in(self, s: Session, key: str, data: dict) -> StoredDoc:
        """백업 불러오기: 버전과 상관없이 덮어쓴다 (부르는 쪽의 트랜잭션 안에서)"""
        return _view(self._write(s, s.get(Document, key, with_for_update=True), key, data))

    def _write(self, s: Session, row: Document | None, key: str, data: dict) -> Document:
        if row is None:
            row = Document(key=key, data=data, version=1, updated_at=self._clock())
            s.add(row)
        else:
            row.data = data
            row.version += 1
            row.updated_at = self._clock()
        s.flush()
        return row
