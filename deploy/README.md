# Ubuntu 24.04 EC2 운영 준비

실제 GitHub 저장소, EC2 호스트, SSH 사용자/키 파일 경로, 도메인은 아직 제공되지 않았습니다. 아래는 검토 가능한 설정이며 자동으로 서버를 생성하거나 배포하지 않습니다. 키 값은 이 저장소/명령 기록/CI에 넣지 않습니다.

## 빌드 방식

EC2 1GB에서는 빌드하지 않고 Ubuntu 24.04 + Node 24 Linux CI 또는 개발 PC의 WSL Ubuntu에서 빌드합니다. [CI](../.github/workflows/ci.yml)는 lint, 보안/파싱 테스트, production build 후 Linux standalone 아티팩트를 만듭니다. Windows 빌드에는 Windows 전용 모듈이 포함될 수 있으므로 Ubuntu 실행용으로 그대로 복사하면 안 됩니다.

빌드에는 식약처 키가 필요 없습니다. 공개 클라이언트 번들에 환경변수를 주입하지 않습니다.

수동 Linux 빌드 시:

```sh
npm ci
npm run lint
node --test tests/*.test.mjs
npm run build
mkdir -p .next/standalone/.next
cp -R public .next/standalone/public
cp -R .next/static .next/standalone/.next/static
cp deploy/start-server.cjs .next/standalone/start-server.cjs
tar --exclude='.env*' --exclude='*.pem' --exclude='*.key' -czf yakmi-linux.tar.gz -C .next/standalone .
```

## 최초 서버 설정

1. Ubuntu 24.04에 Node 24 LTS, npm, Nginx, PM2를 설치합니다. PM2는 이 프로젝트 의존성을 바꾸지 않고 서버에 전역 설치합니다.
2. `/srv/yakmi/releases/`를 운영 사용자 소유로 만듭니다. 예시는 SSH 사용자 `ubuntu`를 사용하지만 실제 환경에 맞춥니다.
3. 보안 그룹에서 80/443과 제한된 SSH 접근만 허용합니다. Node는 `127.0.0.1:3000`에서 실행하며 3000 포트는 공개하지 않습니다.
4. 운영 키 파일을 만들고 **서버 에디터 안에서만** 환경변수를 입력합니다.

```sh
sudo install -d -m 750 -o root -g ubuntu /etc/yakmi
sudo install -m 640 -o root -g ubuntu /dev/null /etc/yakmi/runtime.env
sudoedit /etc/yakmi/runtime.env
```

`runtime.env`에 `MFDS_SERVICE_KEY`를 직접 설정합니다. 내용을 출력하거나 명령행·채팅·로그에 복사하지 마세요. 운영 키는 Git 및 빌드 아티팩트에 포함하지 않습니다.

[start-server.cjs](./start-server.cjs)가 자식 프로세스 안에서 Node `process.loadEnvFile`로 이 파일을 읽습니다. [PM2 설정](./ecosystem.config.cjs)의 `filter_env`는 상위 프로세스가 가진 동명 키를 상속하지 않게 하며, PM2 저장 덤프에 운영 키를 넣지 않습니다. `pm2 env`, `printenv` 등 비밀값을 출력하는 명령을 검증에 사용하지 마세요.

## 릴리스 적용

GitHub CI 아티팩트의 `yakmi-linux.tar.gz`를 서버로 전송합니다. 실제 대상 호스트가 확인된 후 아래 경로를 적용합니다.

```sh
install -d /srv/yakmi/releases/RELEASE_ID
tar -xzf yakmi-linux.tar.gz -C /srv/yakmi/releases/RELEASE_ID
ln -sfn /srv/yakmi/releases/RELEASE_ID /srv/yakmi/current
pm2 startOrReload /srv/yakmi/ecosystem.config.cjs --update-env
pm2 save
```

`RELEASE_ID`는 빌드 커밋 SHA나 배포 일시로 바꾸고, [PM2 설정](./ecosystem.config.cjs)을 `/srv/yakmi/ecosystem.config.cjs`에 설치합니다. 첫 설정 시 `pm2 startup`이 출력한 해당 사용자용 systemd 명령도 적용합니다.

## Nginx

[nginx.conf](./nginx.conf)를 `/etc/nginx/conf.d/yakmi.conf`에 설치하고 기본 사이트와 `server_name` 충돌을 제거합니다. 도메인이 있으면 `server_name _`를 실제 도메인으로 변경합니다. `limit_req_zone`은 http 컨텍스트에 있어야 하므로 sites 파일에 임의로 중첩하지 마세요.

```sh
sudo nginx -t
sudo systemctl reload nginx
```

도메인 연결 후 신뢰할 수 있는 인증서로 HTTPS를 구성합니다. 카메라 직접 촬영 지원은 브라우저/기기와 보안 컨텍스트에 따라 다르며, 일반 파일 선택은 별도로 제공됩니다. 업로드 사진은 외부 전송되지 않습니다.

## 운영 검증 및 롤백

- 홈, 검색, 상세, 식별, localStorage 보관 동작을 실제 도메인에서 확인합니다.
- 세 공식 API별로 승인된 운영 키를 통해 실제 제품명 검색/상세/식별 결과를 확인합니다. 키는 요청 URL에 직접 붙여 수동 호출하지 마세요. 앱의 같은 출처 API를 사용합니다.
- API 오류의 `code`와 일반 메시지만 확인합니다. 인증키/외부 요청 URL/원본 오류는 출력하지 않습니다.
- [Nginx 설정](./nginx.conf)은 API에 IP별 제한을 두며 검색어가 액세스 로그에 남지 않게 합니다. 공식 API 활용 한도도 별도로 확인합니다.
- 문제가 생기면 `current` 심볼릭 링크를 직전 릴리스로 돌리고 PM2를 재시작합니다. 운영 환경 파일은 릴리스 밖에 있으므로 보존됩니다.
- 브라우저 저장소는 출처별이므로 도메인 변경 시 기존 도감이 자동 이동하지 않습니다.

## 현재 검증의 한계

실제 운영 키나 배포 대상이 없어 인증 조회 성공, Linux 아티팩트 실행, PM2 재부팅 복구, Nginx 및 HTTPS 적용은 아직 실서버에서 검증하지 않았습니다. 생성한 Windows 빌드는 로컬 검증용입니다.

