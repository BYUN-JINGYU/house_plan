"""빌드된 화면(frontend/dist) 제공. /api가 아닌 주소는 모두 index.html로 보낸다."""
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

log = logging.getLogger(__name__)


def mount_spa(app: FastAPI, static_dir: str) -> None:
    if not static_dir:
        return
    root = Path(static_dir).resolve()
    index = root / "index.html"
    if not index.is_file():
        log.warning("화면 파일이 없어요: %s (npm run build 먼저)", index)
        return
    if (root / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=root / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str) -> FileResponse:
        if path.startswith("api/"):
            raise HTTPException(status_code=404, detail="없는 주소예요")
        file = _inside(root, path)
        return FileResponse(file) if file else FileResponse(index)


def _inside(root: Path, path: str) -> Path | None:
    """root 안에 있는 실제 파일만 (../ 이나 이상한 글자는 None)"""
    if not path:
        return None
    try:
        file = (root / path).resolve()
        return file if file.is_file() and root in file.parents else None
    except (ValueError, OSError):
        return None
