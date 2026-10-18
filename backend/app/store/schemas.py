"""저장 API가 주고받는 모양"""
import json
from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, Field, StringConstraints

from .documents import StoredDoc
from .ledger import Entry, StoredEntry

MAX_DOC_BYTES = 256_000


def _small(data: dict) -> dict:
    if len(json.dumps(data, ensure_ascii=False).encode()) > MAX_DOC_BYTES:
        raise ValueError("문서가 너무 커요")
    return data


DocData = Annotated[dict, AfterValidator(_small)]


class DocIn(BaseModel):
    data: DocData
    version: int = Field(ge=0)


class DocOut(BaseModel):
    data: dict
    version: int
    updatedAt: datetime

    @classmethod
    def of(cls, doc: StoredDoc) -> "DocOut":
        return cls(data=doc.data, version=doc.version, updatedAt=doc.updated_at)


Category = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
Memo = Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)]


class EntryBody(BaseModel):
    day: date
    kind: Literal["in", "out"]
    category: Category
    amount: int = Field(gt=0, le=100_000_000_000)
    who: Literal["", "a", "b"] = ""
    memo: Memo = ""

    def to_entry(self) -> Entry:
        return Entry(self.day, self.kind, self.category, self.amount, self.who, self.memo)


class EntryOut(EntryBody):
    id: int

    @classmethod
    def of(cls, e: StoredEntry) -> "EntryOut":
        return cls(id=e.id, day=e.day, kind=e.kind, category=e.category, amount=e.amount, who=e.who, memo=e.memo)


class BackupBody(BaseModel):
    format: Literal["houseplan-backup"]
    version: Literal[1]
    docs: dict[str, DocData] = {}
    ledger: list[EntryBody] | None = None
