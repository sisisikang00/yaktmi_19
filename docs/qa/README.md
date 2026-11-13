> 이전 디자인 상태의 기록입니다. 현재 구현은 [최초 디자인 복원 보고서](../restoration/README.md)를 참고하세요.

# 최종 디자인 검수 · SISIDETAIL / 약MI.

검수일: 2026-11-13. 최신 지시를 기준으로 PC도 최대 560px 세로형 앱을 중앙에 표시합니다. 별도 대시보드, 사이드바, PC 분할 화면은 사용하지 않습니다.

## 적용 결과

- SISIDETAIL 로고의 글자에 코발트·코랄·라벤더·미스트 블루 네 색을 실제 적용했습니다. 흰색 배경판, 흰색 외곽선, 글로우를 제거하고 투명 SVG와 네이비 선만 사용합니다.
- 약MI. 로고의 마침표와 원본 말풍선·검색/사진/모양 버튼 아트를 유지했습니다.
- ZIP의 20개 파일을 추출했으며 SHA-256 비교로 원본과 동일함을 확인했습니다. 캐릭터는 8개 프레임과 10개 상태 PNG를 직접 사용합니다. 참고용 시트 전체를 캐릭터로 렌더링하지 않습니다.
- 18개 개별 PNG 모두 8-bit RGBA, 실제 투명 픽셀과 캐릭터 픽셀이 존재함을 디코딩 검사했습니다. 이미지 비율을 유지하는 `object-fit: contain`과 `image-rendering: pixelated`를 적용했습니다.
- 메인 캐릭터만 4초 동안 1→8 프레임을 순서대로 재생합니다. 좌우 ±6px, 상하 ±4px, 회전 ±1.3°로 움직이고 UI는 고정됩니다. 움직임 줄이기 설정에서는 첫 프레임을 정지 표시합니다.
- 홈, 검색 결과, 약 상세, 사진 찾기, 모양 찾기, 약 도감, 보관함에 동일한 배경·픽셀 테두리·메뉴·상태 캐릭터를 적용했습니다.
- 실제 약 사진의 픽셀화는 비활성화합니다. 원본 API URL이 없거나 로딩에 실패하면 미제공 안내를 표시합니다.
- 검색/상세 이동, API 서버 모듈, 저장/즐겨찾기/최근 검색을 유지했습니다. 최근 본 약과 보관함 분류, 도감 페이지 이동도 연결했습니다.

## 실제 화면 캡처

아래 일반 캡처는 실제 로컬 실행 화면입니다. 서버 API 키 미설정으로 검색과 상세에서는 실제 오류 상태를 보여주며, 결과를 임의의 약으로 채우지 않았습니다.

| 화면 | 375px | 430px | 1440px |
| --- | --- | --- | --- |
| 홈 | [캡처](./screenshots/375-home.png) | [캡처](./screenshots/430-home.png) | [캡처](./screenshots/1440-home.png) |
| 검색 결과 | [캡처](./screenshots/375-search.png) | [캡처](./screenshots/430-search.png) | [캡처](./screenshots/1440-search.png) |
| 약 상세 오류 상태 | [캡처](./screenshots/375-detail.png) | [캡처](./screenshots/430-detail.png) | [캡처](./screenshots/1440-detail.png) |
| 사진으로 찾기 | [캡처](./screenshots/375-photo.png) | [캡처](./screenshots/430-photo.png) | [캡처](./screenshots/1440-photo.png) |
| 모양으로 찾기 | [캡처](./screenshots/375-shape.png) | [캡처](./screenshots/430-shape.png) | [캡처](./screenshots/1440-shape.png) |
| 약 도감 | [캡처](./screenshots/375-library.png) | [캡처](./screenshots/430-library.png) | [캡처](./screenshots/1440-library.png) |
| 보관함 | [캡처](./screenshots/375-saved.png) | [캡처](./screenshots/430-saved.png) | [캡처](./screenshots/1440-saved.png) |

상세 내용이 채워진 배치는 분리된 테스트 브라우저에서만 가로챈 **테스트 전용 응답**으로 검증했습니다. 제품명을 “UI 검증 전용 · 실제 의약품 아님”으로 표시하고 실제 복약 정보나 가짜 약 사진을 사용하지 않았습니다. 앱 코드/실제 API/사용자 브라우저 저장소에는 이 데이터를 넣지 않았습니다.

- [375px 테스트 전용 상세 레이아웃](./screenshots/375-detail-TEST-ONLY.png)
- [430px 테스트 전용 상세 레이아웃](./screenshots/430-detail-TEST-ONLY.png)
- [1440px 테스트 전용 상세 레이아웃](./screenshots/1440-detail-TEST-ONLY.png)

## 검증

- ESLint: 오류·경고 없음.
- Next.js production build / TypeScript: 통과.
- 서버 전송·파싱·검증·비밀값 비노출 회귀 테스트 8개: 통과.
- 캐릭터 프레임 및 투명도 테스트 2개: 통과.
- 독립 Headless Chrome: 375/430/768/1440px × 7개 화면, 총 28개 폭 검사 통과. 가로 넘침 없음, 앱 최대 560px, 홈 2열 버튼, 모든 폭의 하단 메뉴 유지.
- 실제 DOM에서 로고 네 색과 배경판 부재 확인.
- 8개 프레임 각각의 표시 구간, 4초 주기, 이동량, UI 고정, reduced-motion 확인.
- 분리된 테스트 브라우저에서 저장·즐겨찾기·최근 검색·최근 본 약 유지, 사진 선택/지우기, 사진 미업로드 확인.
- 브라우저 런타임 예외 및 누락 에셋 없음.
- 실제 Route Handler에 빈 검색/잘못된 페이지/품목코드 입력 시 400, 키 미설정 시 비밀값 없이 503 반환 확인.

기계 검증 결과: [browser-results.json](./browser-results.json). 재현 스크립트: [browser-check.mjs](../../tests/browser-check.mjs). 전용 임시 프로필 Chrome의 로컬 디버깅 포트 9223과 로컬 앱 3001을 대상으로 실행하며, 일반 CI 테스트는 별도의 브라우저 설치 없이 실행됩니다.

## 레퍼런스와 남아 있는 차이

1. 휴대폰 외곽 프레임·가짜 시각·통신/배터리 상태바는 웹 UI에 추가하지 않았습니다. 실제 기기/브라우저의 시스템 UI를 사용합니다.
2. 캐릭터는 정지 레퍼런스 이미지 대신 사용자가 지정한 ZIP 원본입니다. 프레임별 원본 캔버스 크기가 달라 동일한 표시 상자 안에서 여백/시각적 크기가 조금 달라집니다. 자르거나 찌그러뜨리지 않았습니다.
3. 홈의 잔디 경계와 상단 하늘 일부는 CSS 픽셀 패턴입니다. 레퍼런스의 수풀·꽃이 모든 위치에서 픽셀 단위로 동일하지는 않습니다. 하단 풍경은 원본 PNG를 표시합니다.
4. 로고·말풍선·기능 버튼은 원본 PNG 영역을 그대로 표시합니다. 원본에 포함된 배경 질감 때문에 일부 경계에서 옅은 색조 차이가 남습니다.
5. 한글 정보는 읽기 쉬운 시스템 한글 폰트입니다. 레퍼런스에 포함된 래스터 글자의 자형/자간과 완전히 같지는 않습니다. 원본 로고/말풍선/홈 버튼 글자는 유지했습니다.
6. 실제 결과 개수, 제품 사진, 본문 길이는 공식 API 데이터에 따라 달라집니다. 참고 이미지의 예시 타이레놀 정보와 목록 수치는 서비스에 복사하지 않았습니다.
7. 서버 키가 없어 식약처 인증 조회 성공 및 실제 데이터가 채워진 전체 흐름은 아직 검증하지 못했습니다. 키를 요청하거나 출력하지 않았습니다.
8. 사진 자동 인식은 제공하지 않습니다. 업로드 사진 미리보기 후 수동 식별 조건으로 조회합니다. 낱알 조건은 공식 목록 100건 단위 응답에서 필터링하며, 전체 검색 범위를 명시합니다.
9. GitHub 업로드와 EC2 실배포는 대상 정보가 없어 수행하지 않았습니다. [배포 설정과 절차](../../deploy/README.md)는 준비했습니다.

## 주요 변경 파일

- [공통 스타일](../../app/globals.css), [공통 앱 셸](../../components/app-shell.tsx), [브랜드 로고](../../components/brand-logo.tsx)
- [원본 아트 표시](../../components/original-art.tsx), [상태 캐릭터](../../components/potion-character.tsx), [페이지 배너](../../components/scene-header.tsx), [픽셀 아이콘](../../components/pixel-icon.tsx)
- [홈](../../components/home-screen.tsx), [검색](../../components/search-screen.tsx), [상세](../../components/detail-screen.tsx), [사진/모양 식별](../../components/identify-screen.tsx), [도감/보관함](../../components/library-screen.tsx)
- [결과 카드](../../components/medicine-card.tsx), [원본 의약품 사진](../../components/medicine-image.tsx), [브라우저 저장](../../lib/library.ts)
- [공식 API 모듈](../../lib/api/), [Route Handler](../../app/api/), [DTO](../../lib/types/medicine.ts)
- [원본 ZIP 에셋](../../public/assets/character/), [투명도 검증](../../tests/character-assets.test.mjs)

