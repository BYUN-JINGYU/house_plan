"""백업 내려받기·불러오기. 무료 DB가 사라져도 파일 하나로 되살린다."""
from fastapi import APIRouter, Depends, HTTPException

from ..auth.deps import require_session
from ..clock import utcnow
from ..container import Container, get_container
from .documents import DOC_KEYS
from .schemas import BackupBody, EntryOut

router = APIRouter(prefix="/api/backup", tags=["backup"], dependencies=[Depends(require_session)])


@router.get("")
def export_backup(c: Container = Depends(get_container)) -> dict:
    docs = {key: doc.data for key, doc in c.docs.all().items() if key in DOC_KEYS}
    ledger = [EntryOut.of(e).model_dump(mode="json", exclude={"id"}) for e in c.ledger.all()]
    return {"format": "houseplan-backup", "version": 1, "exportedAt": utcnow().isoformat(), "docs": docs, "ledger": ledger}


@router.post("")
def import_backup(body: BackupBody, c: Container = Depends(get_container)) -> dict:
    unknown = sorted(set(body.docs) - set(DOC_KEYS))
    if unknown:
        raise HTTPException(status_code=400, detail=f"모르는 문서: {', '.join(unknown)}")
    with c.db.session() as s:  # 문서와 가계부를 한 번에: 중간에 실패하면 아무것도 안 바뀐다
        for key, data in body.docs.items():
            c.docs.replace_in(s, key, data)
        count = None if body.ledger is None else c.ledger.replace_all_in(s, [e.to_entry() for e in body.ledger])
    return {"docs": sorted(body.docs), "ledger": count}
