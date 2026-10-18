"""가계부 API"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from ..auth.deps import require_session
from ..container import Container, get_container
from .schemas import EntryBody, EntryOut

router = APIRouter(prefix="/api/ledger", tags=["ledger"], dependencies=[Depends(require_session)])
MAX_RANGE_DAYS = 800


@router.get("")
def list_entries(
    start: date = Query(alias="from"),
    end: date = Query(alias="to"),
    c: Container = Depends(get_container),
) -> list[EntryOut]:
    if end < start or (end - start).days > MAX_RANGE_DAYS:
        raise HTTPException(status_code=400, detail="기간이 이상해요")
    return [EntryOut.of(e) for e in c.ledger.between(start, end)]


@router.post("", status_code=201)
def add_entry(body: EntryBody, c: Container = Depends(get_container)) -> EntryOut:
    return EntryOut.of(c.ledger.add(body.to_entry()))


@router.put("/{entry_id}")
def update_entry(entry_id: int, body: EntryBody, c: Container = Depends(get_container)) -> EntryOut:
    saved = c.ledger.update(entry_id, body.to_entry())
    if saved is None:
        raise HTTPException(status_code=404, detail="없는 항목이에요")
    return EntryOut.of(saved)


@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: int, c: Container = Depends(get_container)) -> None:
    if not c.ledger.delete(entry_id):
        raise HTTPException(status_code=404, detail="없는 항목이에요")
