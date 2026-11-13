# SISIDETAIL · 약MI.

Next.js App Router + TypeScript + Tailwind CSS 기반 의약품 검색 웹앱입니다. 기존 패키지 버전을 유지하며 데이터베이스와 추가 런타임 패키지를 사용하지 않습니다.

## 로컬 실행

```sh
npm ci
npm run dev
```

프로젝트 루트에 `.env.local`을 직접 생성하고 `MFDS_SERVICE_KEY` 환경변수를 설정하세요. 실제 키는 로컬 파일에만 입력하며 터미널 명령, 문서, 채팅, Git에 입력하지 마세요. 저장 후 개발 서버를 재시작합니다. `.env*`, `*.pem`, `*.key`는 Git 제외 대상입니다.

키가 없어도 UI는 실행되며 조회 API가 `503 MFDS_NOT_CONFIGURED`를 반환합니다. 실제 조회에는 세 API 모두의 활용 승인과 유효한 키가 필요합니다. 브라우저는 같은 출처의 `/api/*`만 호출합니다. 서버 전용 모듈은 `server-only`로 보호되며 외부 요청은 Node HTTPS로 처리해 Next fetch 추적에 인증 URL이 남지 않게 했습니다. 원본 오류·응답·URL을 로깅하거나 클라이언트에 반환하지 않습니다.

```sh
npm run lint
node --test tests/*.test.mjs
npm run build
npm start
```

워크스페이스 상위의 VS Code 실행 작업도 사용할 수 있습니다.

## 구조

- `app/`: 홈, 검색, 상세, 식별, 도감, 보관함 및 Route Handler
- `components/`: 공통 UI, 원본 아트 표시, 캐릭터 상태, 검색/상세 화면
- `lib/api/`: 공통 보안 전송·검증, e약은요, 허가정보, 낱알식별 모듈
- `lib/types/`: 공식 응답 필드와 클라이언트 DTO
- `lib/library.ts`: localStorage 저장·즐겨찾기·최근 검색
- `docs/api/`: 공식 Swagger 명세 스냅샷과 출처 기록
- `deploy/`: EC2용 Nginx/PM2 설정과 운영 절차
- `tests/`: 실제 데이터와 분리한 전송·보안 회귀 테스트

## 구현 범위

- 홈에서 제품명 검색, 전체 허가 의약품/e약은요 선택 및 12건 페이지네이션
- 품목기준코드로 세 공식 소스를 조회해 상세정보 표시; 부분 실패를 별도 안내
- 효능·용량·주의사항·성분·제조사·허가 정보는 제공되는 값만 표시
- API 제공 사진 원본 표시; 이미지 없음·로딩 실패는 텍스트 대체
- 사진 선택/촬영 및 브라우저 내 미리보기, 모양·색상·각인 수동 식별
- 도감 저장, 즐겨찾기, 최근 검색, 보관함 삭제 및 새로고침 후 유지
- 반응형 화면, 키보드 포커스, 로딩·빈 결과·오류·다시 시도

공식 낱알식별 API에는 모양·색상·각인 요청 파라미터가 없습니다. 이름 검색으로 받은 목록을 서버에서 100건씩 필터링합니다. 따라서 한 범위의 후보 없음은 전체 후보 없음을 뜻하지 않습니다. 화면에서 확인 범위와 다음 조회를 안내합니다. 전체 모양 검색을 빠르게 제공하려면 별도의 공식 전체 목록 동기화/검색 인덱스가 후속 작업으로 필요합니다. 사진 자동 인식은 제공하지 않습니다.

도감은 이 브라우저의 localStorage만 사용합니다. 브라우저 데이터 삭제 시 저장 정보도 삭제되며 기기 간 동기화는 없습니다. 상세 화면은 항상 서버에서 최신 데이터를 다시 조회합니다.

## 원본 아트 보존

첨부 레퍼런스를 `public/brand/`로, 지정한 ZIP을 `public/assets/character/`로 바이트 단위 복사했습니다. 캐릭터는 ZIP의 개별 투명 PNG를 직접 사용하며 홈은 원형이 온전한 기본 PNG에 4초 둥실 움직임을 적용합니다. 제공된 일부 포즈 PNG의 잘림·이웃 조각 문제로 포즈 교차 재생은 사용하지 않습니다. 로고·말풍선·버튼 SVG는 원본 PNG를 참조하고 `viewBox`로 표시할 부분만 지정합니다. 원본 픽셀, 색상, 질감, 글자, 비율을 다시 그리거나 변경하지 않습니다. 화면 크기에 맞춰 종횡비를 유지하며 표시합니다. 실제 의약품 사진에는 픽셀 효과를 적용하지 않습니다. 상세 참고 이미지의 예시 제품명/효능/용량/사진은 서비스 데이터로 복사하지 않습니다.

## 배포

### GitHub + Vercel

1. 이 폴더(`sisidetail-yakmi`)를 Git 저장소의 루트로 사용합니다. 커밋 전에 `git status --short`와 `git diff --cached --name-only`로 업로드 대상 파일을 확인합니다. `.env.local`과 다른 `.env*` 파일은 Git에서 제외합니다.
2. GitHub 저장소를 Vercel에서 Import하고 Framework Preset을 Next.js, Root Directory를 저장소 루트로 설정합니다.
3. Vercel 프로젝트의 Environment Variables에서 `MFDS_SERVICE_KEY`를 **Secret**으로 추가하고 Production에 적용합니다. 값은 배포 설정 화면에 입력합니다. `NEXT_PUBLIC_` 접두사나 `next.config.ts`의 `env` 설정은 사용하지 않습니다.
4. Deploy 후 검색 화면에서 제품 허가정보와 e약은요 검색, 낱알식별을 확인합니다. 환경변수를 나중에 추가하거나 수정하면 다시 배포합니다.

[Vercel의 Git 배포 안내](https://vercel.com/docs/git) · [Secret 환경변수 안내](https://vercel.com/changelog/environment-variables-now-use-config-and-secret-types)

### EC2

[EC2 운영 절차](./deploy/README.md)를 참고하세요. GitHub 저장소와 EC2 대상이 제공되기 전에는 업로드나 실제 배포를 수행하지 않습니다. Windows에서 생성한 standalone의 플랫폼별 런타임 모듈을 Ubuntu에 그대로 복사하지 말고, WSL/Ubuntu 또는 Linux CI에서 빌드하세요.

## 최종 화면 검수

최신 지시에 따라 PC도 중앙의 최대 560px 세로형 앱을 유지합니다. [실제 화면 캡처·검증 결과·레퍼런스와 차이](./docs/qa/README.md)를 확인하세요.


## 최초 디자인 복원

SISIDETAIL 로고 추가 작업을 취소하고 최초 약MI. 원본 디자인으로 복원했습니다. [현재 복원 결과·백업·실제 화면·캐릭터 검수 및 원본과 차이](./docs/restoration/README.md)를 기준으로 확인하세요.

