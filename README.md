# 우리 집 자금 계획 (houseplan)

두 사람이 대출을 끼고 집을 살 때, 잔금이 되는지와 그 뒤 몇 년을 한 화면에서 보는 웹앱.
주소만으로 바로 열리고(로그인은 켤 수 있다), 무료 서버·무료 DB·무료 주소로 돌아간다.

## 화면

| 탭 | 보는 것 |
|---|---|
| 한눈에 | 잔금 판정과 세 단계(구매 전 → 구입일 → 구매 후), 점검할 것(눈여겨볼 숫자 한 줄씩), 필요한 돈을 무엇으로 채우는지, 잔금 후 숫자 3개, 위기 시험(금리·PS·주가·월급·생활비), 바로 바꿔 보기 |
| 자산 | 사람을 고르고 항목 탭으로: 은행, 특별성과급, 잔금 전 달마다 월급(비우면 가정 값), 증권(구성·쏠림·해외 양도세 나눠 팔기, 종목마다 펼쳐 고치기, 계좌별 수수료, 팔면 받는 돈), 퇴직금 중간정산 |
| 구매 전 | 잔금 전까지 모을 돈, 계약금, 오늘부터 잔금까지 달마다 들어오고 나가는 돈(통장처럼) |
| 구입일 | 계산식, 부대비용, 잔금일에 받는 대출, 잔금 뒤 첫 달 대출 |
| 구매 후 | 달마다 대출(사내대출 이자·원금, 금고 이자, 이자 혜택 세금), 금고 상환(비우면 계획), 금리 바뀐 달, 낸 달 '냄' 도장, 월 실수령 쓰임, 잔액 그래프 |
| 가계부 | 달별 수입·지출, 생활비 평균 → 생활비 가정에 반영, 이 달 기록, 분류별 지출, 최근 6달 |
| 할 일 | 확인할 것(묶음별, 구입일·구매 후 할 일 한 번에 더하기), 날짜(지난 일은 흐리게), 참고 링크, 앞으로 12달 돈 일정(재산세·취득세 기한·대출 포함) |
| 가정 | 모든 가정 값, 백업 내려받기·불러오기 |

시세는 지연 시세다: 국내는 pykrx(네이버 일봉), 미국과 환율은 yfinance, 환율 예비는 유럽중앙은행(Frankfurter).
못 받은 종목은 현재가를 직접 넣으면 된다.

## 무료로 띄우기 (15분)

1. **Neon** (무료 Postgres): <https://neon.tech> 가입 → 새 프로젝트, Region은 Singapore → Connection string 복사
2. **Render** (무료 서버 + 주소): <https://render.com> 에 GitHub로 가입 → New → Blueprint → 이 저장소 선택
   - `DATABASE_URL`: 1에서 복사한 값
   - `APP_PASSWORD`: 로그인을 켤 때만 쓰는 비밀번호 (12자 이상, 짧으면 로그인이 막힌다)
   - Apply → 몇 분 뒤 `https://houseplan-xxxx.onrender.com` 이 생긴다
3. 접속 → **가정** 탭 → 백업 **불러오기**로 초기값 파일을 넣는다
4. (선택) 시세 자동 갱신: Render의 houseplan → Environment에서 `CRON_TOKEN` 값을 복사 →
   GitHub 저장소 Settings → Secrets and variables → Actions 에 두 개를 넣는다
   - `APP_URL` = `https://houseplan-xxxx.onrender.com`
   - `CRON_TOKEN` = 복사한 값

비밀번호를 평문 대신 해시로 두려면 `cd backend && python -m app.cli hash-password` 결과를 `APP_PASSWORD_HASH`에 넣고 `APP_PASSWORD`는 지운다.

## 알아 둘 것

- 무료 서버는 15분 동안 아무도 안 쓰면 잠든다. 다시 열 때 1분쯤 걸린다.
- `render.yaml`의 `REQUIRE_LOGIN`이 `false`라 로그인이 없다. 주소를 아는 누구나 보고 고치니 주소를 공개된 곳에 올리지 않는다.
- 검색엔진에는 안 뜨게 막아 두었다(`robots.txt`, `X-Robots-Tag`).
- 로그인을 켜려면 `REQUIRE_LOGIN`을 `true`로 바꾸고 `APP_PASSWORD`를 넣는다. 켜면 아래처럼 동작한다.
  - 같은 곳에서 비밀번호를 5번 틀리면 10분 동안 막힌다. 여러 곳에서 많이 틀리면 막지 않고 천천히 받는다.
  - 로그인은 쓰는 동안 연장되고, 30일 동안 안 쓰면 끝난다. 비밀번호를 바꾸면 모든 기기가 다시 로그인한다.
- 무료 DB라 가끔 가정 탭에서 백업을 내려받아 둔다.
- 저장소가 공개라면 개인 숫자(이름·연봉·집)는 코드에 넣지 않는다. 숫자는 DB와 백업 파일에만 둔다.

## 로컬 실행

```bash
# 서버 (http://127.0.0.1:8000)
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:create_app --factory --reload

# 화면 (http://localhost:5173, /api는 서버로 넘김)
cd frontend
npm ci
npm run dev
```

테스트: `cd backend && python -m pytest -q`, `cd frontend && npm test`

## 구조

```
backend/app/
  auth/      로그인(켰을 때): 비밀번호 확인, 세션 쿠키, 연속 실패 제한
  store/     문서(계획·사람·할 일) 저장, 가계부, 백업
  quotes/    시세 공급자(pykrx·yfinance·ECB) → 순서대로 예비 → DB 캐시
  web/       보안 헤더, 빌드된 화면 제공, 상태 확인
  container.py  부품 조립 (테스트는 공급자를 바꿔 끼운다)
frontend/src/
  domain/    돈 계산 (순수 함수 + 테스트)
  state/     서버와 맞추기 (자동 저장, 시세, 가계부)
  ui/        공통 조각 (입력칸, 막대, 그래프)
  views/     화면
```
