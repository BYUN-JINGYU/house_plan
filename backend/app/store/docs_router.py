"""화면 문서 API: 한 번에 다 읽고, 문서 하나씩 저장"""
from fastapi import APIRouter, Depends, HTTPException

from ..auth.deps import require_session
from ..container import Container, get_container
from .documents import DOC_KEYS, VersionConflict
from .schemas import DocIn, DocOut

router = APIRouter(prefix="/api/docs", tags=["docs"], dependencies=[Depends(require_session)])


@router.get("")
def list_docs(c: Container = Depends(get_container)) -> dict[str, DocOut]:
    return {key: DocOut.of(doc) for key, doc in c.docs.all().items() if key in DOC_KEYS}


@router.put("/{key}")
def put_doc(key: str, body: DocIn, c: Container = Depends(get_container)) -> DocOut:
    if key not in DOC_KEYS:
        raise HTTPException(status_code=404, detail="없는 문서예요")
    try:
        return DocOut.of(c.docs.save(key, body.data, body.version))
    except VersionConflict as err:
        current = DocOut.of(err.current).model_dump(mode="json") if err.current else None
        raise HTTPException(status_code=409, detail={"message": "다른 곳에서 먼저 바꿨어요", "current": current}) from None
