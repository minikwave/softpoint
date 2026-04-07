# Cursor 브라우저에서 점검하기

## 지금 상태

- **API**: http://localhost:3000 (실행 중)
- **웹앱**: http://localhost:5173 (실행 중, 응답 200 확인됨)

`pnpm run serve` 가 백그라운드에서 이미 실행 중입니다.

## Cursor 브라우저에서 여는 방법

1. **Ctrl+Shift+P** (Mac: **Cmd+Shift+P**) 로 명령 팔레트 열기  
2. **"Simple Browser: Show"** 입력 후 실행  
3. URL에 **http://localhost:5173** 입력 후 엔터  

## 점검할 화면

| URL | 확인 내용 |
|-----|-----------|
| http://localhost:5173 | 랜딩 — 헤더(제품·개발자·디앱), MVP 데모 pill, **디앱 들어가기**, **가게 관리** |
| http://localhost:5173/product | 제품 — 쌓음/PayPoint, MVP·한계·로드맵 링크 |
| http://localhost:5173/developers | 개발자 — 빠른 시작, OpenAPI·문서 링크(기본 GitHub) |
| http://localhost:5173/app | 디앱 — 잔액 / 내역 / 결제 / 정산 옵션 / 가게 메뉴 |
| http://localhost:5173/app/store | 가게 — 가맹점 ID, 정산 요청, 전환 목록 |

## API(잔액·내역 등)가 동작하려면

- 프로젝트 루트에 **.env** 가 있고, 그 안에 **DATABASE_URL** 이 있어야 합니다.
- PostgreSQL 이 로컬에 설치·실행 중이면 `.env` 의 `DATABASE_URL` 을 실제 연결 문자열로 수정한 뒤:
  - 터미널에서 `pnpm db:push` 실행
  - **서버를 한 번 재시작**: 기존 `pnpm run serve` 종료 후 다시 `pnpm run serve` 실행

이후 Cursor 브라우저에서 http://localhost:5173 으로 접속해 위 화면들을 순서대로 열어보면 됩니다.
