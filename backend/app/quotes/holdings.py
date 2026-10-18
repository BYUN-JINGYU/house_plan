"""사람 문서에서 시세가 필요한 종목 뽑기 (자동 갱신용). 원/달러는 항상 넣는다."""
from .types import USDKRW_KEY, Symbol


def symbols_in_people(data: dict | None) -> list[Symbol]:
    found: dict[str, Symbol] = {}
    for person in (data or {}).values():
        if not isinstance(person, dict):
            continue
        for broker in person.get("brokers") or []:
            for holding in (broker or {}).get("holdings") or []:
                try:
                    symbol = Symbol.parse(f"{holding.get('market', '')}:{holding.get('code', '')}")
                except (ValueError, AttributeError):
                    continue
                found[symbol.key] = symbol
    found[USDKRW_KEY] = Symbol("FX", "USDKRW")
    return list(found.values())
