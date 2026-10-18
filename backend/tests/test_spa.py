"""빌드된 화면 제공: 파일, 깊은 주소, 이상한 주소"""
import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def site(tmp_path, settings, provider) -> TestClient:
    static = tmp_path / "dist"
    (static / "assets").mkdir(parents=True)
    (static / "index.html").write_text("<!doctype html><title>index</title>")
    (static / "assets" / "app.js").write_text("console.log(1)")
    (static / "favicon.svg").write_text("<svg/>")
    (tmp_path / "secret.txt").write_text("secret")
    return TestClient(create_app(settings.model_copy(update={"static_dir": str(static)}), provider=provider))


def test_files_and_deep_links(site):
    assert site.get("/favicon.svg").text == "<svg/>"
    assert site.get("/assets/app.js").headers["cache-control"].startswith("public")
    assert "index" in site.get("/some/deep/link").text
    assert site.get("/api/nope").status_code == 404


def test_odd_paths_fall_back_to_index(site):
    for path in ("/%00", "/..%2fsecret.txt", "/%2e%2e/secret.txt"):
        response = site.get(path)
        assert response.status_code == 200 and "secret" not in response.text, path
