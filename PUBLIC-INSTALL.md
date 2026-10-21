# 다른 사람에게 배포하는 설치 방식

개인 PC 경로 없이, 공개 배포 URL 하나와 각 사용자의 KOSIS API 키로 설치한다.

## 배포자가 한 번 하는 작업

1. 수정된 소스를 본인 GitHub fork에 반영한다.
2. 저장소 루트에서 `npm.cmd ci`, `npm.cmd run build`를 실행한다.
3. `npm.cmd pack --ignore-scripts`로 `kosis-workspace-0.3.0-fix.1.tgz`를 만든다. 함께 전달한 파일은 이미 빌드·패키징한 동일 결과다.
4. 본인 공개 GitHub 저장소의 `v0.3.0-fix.1` Release에 이 tgz 파일을 첨부한다.
5. 아래 JSON의 YOUR_ACCOUNT를 실제 저장소 소유자로 교체한 뒤 공유한다. 저장소 이름도 다르면 같이 바꾼다.

별도 npm 게시 권한 없이 공개 GitHub Release 파일로 배포할 수 있다. 업로드는 이 작업에서 수행하지 않았다. 예시 URL은 실제 배포 주소가 아니다.

## 사용자가 넣는 Windows Claude Desktop 설정

```json
{
  "mcpServers": {
    "kosis": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "--package=https://github.com/YOUR_ACCOUNT/kosis-mcp/releases/download/v0.3.0-fix.1/kosis-workspace-0.3.0-fix.1.tgz",
        "kosis-mcp"
      ],
      "env": {
        "KOSIS_API_KEY": "각 사용자의 KOSIS API 키"
      }
    }
  }
}
```

기존 설정이 있으면 `mcpServers` 안의 kosis 항목만 추가하거나 교체하고 다른 서버 항목은 보존한다. Node.js/npm이 설치되어 PATH에서 실행되어야 한다. 권장 버전은 Node.js 24 LTS다. Git이나 로컬 소스 다운로드·빌드는 사용자에게 필요하지 않다. 설정 저장 후 Claude를 완전히 종료하고 다시 연다.

macOS/Linux에서는 같은 패키지 URL을 쓰되 `command`를 `npx`로, `args`는 `-y`부터 시작하도록 바꾼다.

## 소스 fork에서 직접 설치하는 대안

루트에 `bin`, 런타임 의존성과 portable build를 추가해 Git 기반 설치도 지원하는 구조로 수정했다.

```text
npx -y --package=github:YOUR_ACCOUNT/kosis-mcp#fix/parameter-data kosis-mcp
```

이 방식은 사용자의 Git 설치와 최초 빌드가 필요하다. 공유할 때는 위 Release tgz 방식이 간단하다. 실제 원격 fork 설치는 공개 저장소에 반영한 다음 확인해야 한다.

## 배포본에 포함되는 수정

- 로컬에서 수정한 client/services를 서버와 같은 build 폴더에 포함한다.
- 서버가 npm의 수정 전 kosis-cli를 다시 가져오지 않도록 로컬 코어를 참조한다.
- 루트에 MCP 실행 진입점과 SDK/zod 런타임 의존성을 명시한다.
- 키, 개인 경로, 로컬 node_modules는 배포 패키지에 포함하지 않는다.
- 소스가 없는 별도 폴더에서 npx로 tgz를 설치하고 실제 MCP tools/call로 2023–2025 실업률 3행을 받는 것을 확인했다.

npm의 Git 및 tarball 설치: https://docs.npmjs.com/cli/v11/commands/npm-install/

npx의 package 지정 방식: https://docs.npmjs.com/cli/v11/commands/npx/
