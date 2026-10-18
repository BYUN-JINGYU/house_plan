"""시각 도우미. DB가 시간대를 잃어도(SQLite) UTC로 맞춘다."""
from datetime import UTC, datetime


def utcnow() -> datetime:
    return datetime.now(UTC)


def as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
