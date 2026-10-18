"""환경 변수 설정. 배포 서버 대시보드나 backend/.env에서 읽는다."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./houseplan.db"
    # 비어 있으면 서버가 켜질 때마다 새로 만든다 (재시작하면 다시 로그인)
    session_secret: str = ""
    # 둘 중 하나: 해시(권장, python -m app.cli hash-password) 또는 평문
    app_password_hash: str = ""
    app_password: str = ""
    # 시세 자동 갱신(GitHub Actions)이 쓰는 토큰
    cron_token: str = ""
    cookie_secure: bool = True
    session_days: int = 30
    quote_ttl_minutes: int = 30
    quote_min_gap_seconds: int = 120
    static_dir: str = ""
    login_window_seconds: int = 600
    login_max_per_client: int = 5
    login_max_overall: int = 20
