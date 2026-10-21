# KOSIS MCP err 20 수정본

여러 사용자에게 같은 JSON을 배포하는 방법은 [PUBLIC-INSTALL.md](PUBLIC-INSTALL.md)를 참고한다. 아래는 로컬 소스를 직접 실행할 때의 대안이다.

원본: https://github.com/updown256/kosis-mcp

기준 커밋: ab8480776ab9a3e4773a4cb05eb23416681437f9 (패키지 0.3.0)

## 확인 결과

2026-10-21에 같은 사용자 인증키와 조회조건으로 실제 API를 비교했다.

- 원본 `statisticsData.do?method=getList` 요청: HTTP 200이지만 `err: "20"`.
- 수정본 `Param/statisticsParameterData.do?method=getList`: 정상 3행.
- `orgId=101`, `tblId=DT_1DA7002S`, `itmId=T80`, `objL1=00`, `prdSe=Y`, `startPrdDe=2023`, `endPrdDe=2025`.
- 반환값: 2023년 2.7%, 2024년 2.8%, 2025년 2.8%. 원자료 연간 수치이며 월별 평균 계산값이 아니다.
- 실제 ITM 메타정보는 항목 T80=실업률, 분류1 00=15세 이상 전체를 확인했고 추가 분류는 없었다.
- 연간 요청 코드는 Y, 이 표의 응답 PRD_SE는 A다. 원응답을 임의로 바꾸지 않는다.
- 자료등록 방식은 `userStatsId`와 기존 `statisticsData.do`를 계속 사용한다. 메타자료도 기존 getMeta 경로를 사용한다.
- 빌드 및 총 57개 테스트 통과. 실제 MCP stdio `tools/call` → KOSIS → 3개 연도 응답 포함.
- 원본 lockfile의 누락된 플랫폼 의존성을 보완했다. CLI/MCP 테스트 파일의 Windows 경로 처리도 수정했다.
- 인증키는 결과물에 포함하지 않았다. 원격 저장소와 npm 배포본은 변경하지 않았다.

공식 요청변수: https://kosis.kr/openapi/devGuide/devGuide_0201List.do

## Windows에서 로컬 수정본 사용

이 폴더에는 소스와 빌드 결과가 모두 들어 있다. 이 PC의 전달 폴더에는 실행 의존성도 설치했다.
ZIP을 다른 곳에 풀었거나 의존성이 없는 경우 Node.js 24 LTS와 npm을 설치하고 이 폴더에서 실행한다.

```powershell
npm.cmd ci --omit=dev --ignore-scripts
```

Claude Desktop을 완전히 종료한다. 이 폴더에서 아래를 실행하면 설정을 백업한 후 기존 kosis 항목의 command/args만 바꾼다. 다른 MCP, 기존 env와 API 키는 유지한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Use-LocalKosis.ps1
```

기존 항목명이 kosis가 아니라면 `-ServerName 실제항목명`을 붙인다. 설정 위치가 다르면 `-ConfigPath '설정파일의 절대경로'`, Node 위치가 다르면 `-NodePath 'node.exe의 절대경로'`를 붙인다.
설정이 없거나 지정한 항목이 없으면 파일을 바꾸지 않고 종료한다. 설정 백업에도 기존 키가 들어 있으므로 원래 설정과 같은 방식으로 보관한다.

수동 변경: Claude Settings → Developer → Edit Config를 열고 기존 `mcpServers` 안의 KOSIS 항목에서 command와 args만 교체한다. 전체 파일을 예시 JSON으로 덮어쓰지 않는다.

```json
{
  "kosis": {
    "command": "C:\\Program Files\\nodejs\\node.exe",
    "args": ["C:\\설치폴더\\kosis-mcp-fixed\\packages\\kosis-mcp\\build\\server.js"],
    "env": { "KOSIS_API_KEY": "기존 값을 그대로 유지" }
  }
}
```

이는 `mcpServers` 내부 항목의 구조 예시다. 함께 전달한 `claude-kosis-entry.json`에는 이 PC의 정확한 경로가 들어 있다. 그 파일의 env 값은 설명용이므로 기존 실제 키를 보존한다.
다시 Claude Desktop을 열고 `kosis_data`로 위 조건을 조회한다. 다른 npx KOSIS 항목을 중복으로 추가하지 않는다.

## 소스 수정 및 fork에 적용

워크스페이스 루트에서 설치하고 CLI → MCP 순서로 빌드한다. MCP 폴더만 따로 npm 설치하면 수정되지 않은 npm의 kosis-cli 코어가 사용될 수 있다.

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd test
```

fork를 사용하려면 GitHub에서 원본을 fork한 후 다음과 같이 전달된 패치를 적용한다.

```powershell
git clone https://github.com/YOUR_ACCOUNT/kosis-mcp.git
cd kosis-mcp
git checkout -b fix/parameter-data ab8480776ab9a3e4773a4cb05eb23416681437f9
git apply 'C:\\다운로드폴더\\kosis-mcp-fix.patch'
npm.cmd ci
npm.cmd run build
npm.cmd test
```

YOUR_ACCOUNT와 패치 파일 경로를 바꾼다. 이 로컬 설치 방식에서는 Claude의 args를 해당 fork의 `packages/kosis-mcp/build/server.js` 절대경로로 설정한다. 이번 수정으로 루트의 portable build와 bin도 추가했다. 개인 경로가 필요 없는 공개 설치 방법은 PUBLIC-INSTALL.md를 따른다.
`npx -y kosis-mcp`는 npm에 공개된 원본을 사용하므로 이 로컬 수정을 적용하지 않는다.

## 키를 표시하지 않는 실제 MCP 확인

PowerShell에서 다음을 실행하면 키를 가려 입력받고 현재 프로세스에만 전달한다. 결과는 연도와 수치만 출력한다.

```powershell
$secret = Read-Host 'KOSIS API key' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
$previous = $env:KOSIS_API_KEY
try {
    $env:KOSIS_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    node .\scripts\verify-live.mjs
} finally {
    $env:KOSIS_API_KEY = $previous
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
```

키는 소스, 커밋, 명령행 인자 또는 보고서에 넣지 않는다.
