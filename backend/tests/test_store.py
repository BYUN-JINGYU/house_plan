"""문서 저장(버전 충돌), 가계부, 백업"""


def test_docs_start_empty_and_save_with_version(authed):
    assert authed.get("/api/docs").json() == {}
    first = authed.put("/api/docs/plan", json={"data": {"names": {"a": "가"}}, "version": 0})
    assert first.status_code == 200 and first.json()["version"] == 1
    second = authed.put("/api/docs/plan", json={"data": {"names": {"a": "나"}}, "version": 1})
    assert second.json()["version"] == 2
    assert authed.get("/api/docs").json()["plan"]["data"] == {"names": {"a": "나"}}


def test_stale_version_gets_conflict_with_current(authed):
    authed.put("/api/docs/people", json={"data": {"x": 1}, "version": 0})
    stale = authed.put("/api/docs/people", json={"data": {"x": 2}, "version": 0})
    assert stale.status_code == 409
    assert stale.json()["detail"]["current"]["data"] == {"x": 1}


def test_unknown_doc_and_huge_doc_are_refused(authed):
    assert authed.put("/api/docs/evil", json={"data": {}, "version": 0}).status_code == 404
    huge = {"blob": "가" * 100_000}
    assert authed.put("/api/docs/plan", json={"data": huge, "version": 0}).status_code == 422


ENTRY = {"day": "2026-10-03", "kind": "out", "category": "생활비", "amount": 52_000, "who": "a", "memo": "장보기"}


def test_ledger_crud_and_range(authed):
    made = authed.post("/api/ledger", json=ENTRY)
    assert made.status_code == 201
    entry_id = made.json()["id"]
    authed.post("/api/ledger", json={**ENTRY, "day": "2026-09-30"})
    october = authed.get("/api/ledger", params={"from": "2026-10-01", "to": "2026-10-31"}).json()
    assert [e["id"] for e in october] == [entry_id]
    updated = authed.put(f"/api/ledger/{entry_id}", json={**ENTRY, "amount": 60_000})
    assert updated.json()["amount"] == 60_000
    assert authed.delete(f"/api/ledger/{entry_id}").status_code == 204
    assert authed.delete(f"/api/ledger/{entry_id}").status_code == 404


def test_ledger_validation(authed):
    assert authed.post("/api/ledger", json={**ENTRY, "amount": 0}).status_code == 422
    assert authed.post("/api/ledger", json={**ENTRY, "kind": "spend"}).status_code == 422
    assert authed.post("/api/ledger", json={**ENTRY, "category": "   "}).status_code == 422
    trimmed = authed.post("/api/ledger", json={**ENTRY, "category": " 생활비 ", "memo": " 장보기 "}).json()
    assert trimmed["category"] == "생활비" and trimmed["memo"] == "장보기"
    assert authed.get("/api/ledger", params={"from": "2026-10-31", "to": "2026-10-01"}).status_code == 400


def test_loans_doc_is_saved_and_backed_up(authed):
    saved = authed.put("/api/docs/loans", json={"data": {"months": {"2027-05": {"paid": True}}}, "version": 0})
    assert saved.status_code == 200
    assert authed.get("/api/backup").json()["docs"]["loans"]["months"]["2027-05"]["paid"] is True


def test_backup_roundtrip(authed):
    authed.put("/api/docs/plan", json={"data": {"title": "우리 집"}, "version": 0})
    authed.post("/api/ledger", json=ENTRY)
    backup = authed.get("/api/backup").json()
    assert backup["format"] == "houseplan-backup" and backup["docs"]["plan"] == {"title": "우리 집"}
    backup["docs"]["plan"] = {"title": "새 집"}
    restored = authed.post("/api/backup", json=backup)
    assert restored.json() == {"docs": ["plan"], "ledger": 1}
    docs = authed.get("/api/docs").json()
    assert docs["plan"]["data"] == {"title": "새 집"} and docs["plan"]["version"] == 2


def test_backup_without_ledger_keeps_ledger(authed):
    authed.post("/api/ledger", json=ENTRY)
    body = {"format": "houseplan-backup", "version": 1, "docs": {"checks": {"items": []}}}
    assert authed.post("/api/backup", json=body).json() == {"docs": ["checks"], "ledger": None}
    assert len(authed.get("/api/backup").json()["ledger"]) == 1


def test_backup_rejects_unknown_docs(authed):
    body = {"format": "houseplan-backup", "version": 1, "docs": {"evil": {}}}
    assert authed.post("/api/backup", json=body).status_code == 400
