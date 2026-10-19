# houseplan

두 사람이 대출을 끼고 집을 살 자금 계획 웹앱. FastAPI(`backend/`) + React·Vite·TS(`frontend/`).
로그인은 `REQUIRE_LOGIN`으로 켜고 끈다. 배포는 꺼 두었다(`render.yaml`): 주소를 아는 누구나 보고 고친다.
배포·로컬 실행은 README.

## 확인 명령

- `cd backend && python -m pytest -q`
- `cd frontend && npm test && npm run build` (build가 `tsc` 타입 검사까지 한다)

일을 마쳤다는 기준: 두 줄 모두 통과.

## 지도

- 돈 계산의 유일한 원천은 `frontend/src/domain/` (순수 함수, 테스트 동봉). 백엔드는 계산하지 않는다: 문서 저장, 가계부, 시세만.
- `domain/compute.ts`가 문서 3개 + 시세 + 오늘 날짜 → 화면 숫자 전부. 날짜가 지난 수입(월급·PI·PS)은 통장에 있다고 보고 뺀다(`scenario.ts`).
- 월급은 사람별로 달마다 적는다(`pay.ts`, people 문서의 `pay`). 안 적은 달은 가정의 월 실수령(둘 합계)을 계약연봉 비율로 나눈 값.
- 화면 상태: `state/sync.ts`의 `DocSync`가 문서(plan·people·checks)를 버전과 함께 자동 저장, 409면 서버 값으로 바꾼다.
- 시세: `backend/app/quotes/` 공급자(Protocol) → `FallbackChain` → `QuoteService`(DB 캐시, TTL). 새 공급자는 `container.default_provider()`에 끼운다.
- 의존성 조립은 `backend/app/container.py` 한 곳. 테스트는 `create_app(settings, provider=가짜)`로 바꿔 끼운다.

## 규칙

- 단위: 계획 금액은 만원, 가계부는 원, 주가는 원(국내)·달러(미국), 비율은 소수.
- SOLID, 작은 파일: 파일당 300줄 이하, 대부분 150줄 안. 커지면 책임별로 나눈다.
- 공개 저장소: 이름·연봉·집 같은 개인 값은 코드·테스트·커밋 메시지에 쓰지 않는다. 코드 기본값은 예시 값이고, 실제 값은 DB(가정 덮어쓰기)와 백업 파일에만 있다.
- 화면 글: 짧게, 한 문장은 한 줄, '~요' 체.
- CSP는 `'self'`만 허용한다. 외부 스크립트·글꼴 대신 패키지로 묶고, data: 글꼴이 생기지 않게 Vite `assetsInlineLimit: 0`을 유지한다.
- 그래프 색은 `--s1`~`--s4` 순서대로 쓰고, 값 글자나 표를 같이 보여 준다(s3·s4는 밝은 배경에서 대비가 낮다).

## 함정

- 야후는 클라우드 IP를 429로 자주 막는다: 막히면 15분 쉬고 다음 공급자로. 국내는 pykrx(네이버 일봉, KRX 로그인 불필요)가 먼저.
- `import pykrx`는 matplotlib까지 불러와 무겁다: 공급자 함수 안에서만 늦게 import.
- DB 스키마는 `create_all`뿐(마이그레이션 없음). 열을 바꾸면 기존 DB를 직접 옮겨야 한다.
- 문서 키는 `DOC_KEYS`(plan, people, checks)만 허용한다. 새 문서는 백엔드 목록, 프론트 `DataProvider`, 백업에 같이 넣는다.
- 무료 Render는 15분 쉬면 잠든다. 로그인 시도 제한(`auth/guard.py`)은 메모리라 재시작하면 초기화된다.
- 시도 제한은 X-Forwarded-For 첫 값을 접속 주소로 믿는다(Render가 실제 주소로 채운다). 다른 호스팅으로 옮기면 `client_key`부터 다시 본다.
- 시세 자동 갱신 응답은 공개 Actions 기록에 남는다: 종목 이름을 돌려주지 않는다(개수만).
- `frontend/.npmrc`의 `legacy-peer-deps`는 npm 10의 peer 해석 오류 회피용이라 지우지 않는다.
