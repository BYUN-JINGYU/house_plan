"""표(DataFrame)에서 마지막 종가와 날짜 꺼내기"""
from datetime import date
from typing import Any


def last_close(frame: Any, column: str) -> tuple[float, date] | None:
    if frame is None or getattr(frame, "empty", True) or column not in frame:
        return None
    series = frame[column].dropna()
    series = series[series > 0]
    if series.empty:
        return None
    stamp = series.index[-1]
    day = stamp.date() if hasattr(stamp, "date") else date.fromisoformat(str(stamp)[:10])
    return float(series.iloc[-1]), day
