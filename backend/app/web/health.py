"""서버 상태 확인 (배포 서버가 살아 있는지 묻는 주소, 로그인 불필요)"""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health() -> dict[str, bool]:
    return {"ok": True}
