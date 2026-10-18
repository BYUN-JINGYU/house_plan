"""명령줄 도구

python -m app.cli hash-password   → APP_PASSWORD_HASH에 넣을 값을 만든다
"""
import argparse
import getpass
import sys

from .auth.passwords import MIN_LENGTH, hash_password


def _hash_password() -> int:
    first = getpass.getpass("새 비밀번호: ")
    if len(first) < MIN_LENGTH:
        print(f"{MIN_LENGTH}자 이상으로 정해 주세요.", file=sys.stderr)
        return 1
    if getpass.getpass("한 번 더: ") != first:
        print("두 번 입력한 값이 달라요.", file=sys.stderr)
        return 1
    print(hash_password(first))
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    parser.add_argument("command", choices=["hash-password"])
    parser.parse_args(argv)
    return _hash_password()


if __name__ == "__main__":
    raise SystemExit(main())
