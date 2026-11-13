# 식약처 공통 인증키 실제 조회 검증

2026-11-13. 서버 전용 공통 모듈이 앱 루트의 `.env.local`에 저장한 `MFDS_SERVICE_KEY` 하나를 읽도록 통일했습니다. 상위 `.env`의 중복 항목은 제거했습니다. 실제 키는 출력하거나 이 문서에 기록하지 않았습니다.

## 공식 명세 확인

- [e약은요](https://www.data.go.kr/data/15075057/openapi.do): `ServiceKey`, `itemName`, `itemSeq`, `pageNo`, `numOfRows`, `type`.
- [제품 허가정보](https://www.data.go.kr/data/15095677/openapi.do): `serviceKey`, 목록 `item_name`, 상세 `item_seq`, 페이지 및 JSON 형식.
- [낱알식별정보](https://www.data.go.kr/data/15057639/openapi.do): `serviceKey`, `item_name`, `item_seq`, 페이지 및 JSON 형식.

외부 호출은 기존 `server-only` 모듈의 Node HTTPS를 사용합니다. 브라우저는 같은 출처의 Next.js Route Handler만 호출합니다.

## 실제 검색 결과

‘타이레놀’ 검색, 테스트 자료 주입 없이 실제 공식 API 응답을 확인했습니다.

| API | HTTP | 결과 |
|---|---|---|
| e약은요 | 200 | 7건 |
| 허가정보 목록 | 200 | 7건 |
| 낱알식별 | 200 | 후보 4건 |
| 품목 `202005623` 상세 | 200 | 효능·용법·성분 제공, 조회 실패 출처 없음 |

해당 상세 품목에는 이미지가 제공되지 않아 기존 안내용 이미지 영역을 유지했습니다. 약 사진을 생성하지 않았습니다.

격리된 실제 Chrome에서도 검색 카드 7개와 상세정보·4개 탭 표시를 확인했습니다. 캡처는 `screenshots/1440-real-search.png`, `screenshots/1440-real-detail.png`입니다. 검수 서버의 외부 접속은 제한 환경 밖에서 허용한 뒤 확인했습니다.

## 변경 및 보안

- `lib/api/mfds.ts`: 공통 환경변수 이름과 키 누락 안내 변경. 세 API 모듈은 모두 이 모듈을 재사용.
- `tests/mfds.test.mjs`: 새 환경변수 기준으로 수정하고 세 API의 공통 키 사용 테스트 추가.
- `deploy/start-server.cjs`, `deploy/ecosystem.config.cjs`, `deploy/README.md`, 루트 `README.md`: 운영·개발 환경변수 이름 통일.
- 검색·사진 식별·상세 페이지의 URL 데이터 접근을 Suspense 안으로 옮겨 Next.js의 URL 로딩 경계 문제 보완. 기존 로딩 화면·레이아웃·디자인·데이터 구조 유지.
- `.env.local`의 Git 제외 확인. 공개 JavaScript 189개와 실제 API 응답 3개에서 실제 인증키 검출 0건. 키 포함 URL과 원본 오류는 로그·응답으로 전달하지 않음.
- 프로덕션 빌드·TypeScript·ESLint 통과. 테스트 11개 통과.

예전 UI 검수 보고서의 ‘실제 API 인증 미검증’ 상태는 이 검증으로 대체됩니다. 모든 품목·조건·네트워크 상황을 검증했다는 의미는 아닙니다.
