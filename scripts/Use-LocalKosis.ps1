param(
    [string]$ConfigPath = (Join-Path $env:APPDATA 'Claude\claude_desktop_config.json'),
    [string]$ServerName = 'kosis',
    [string]$NodePath = 'C:\Program Files\nodejs\node.exe'
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$server = Join-Path $root 'packages\kosis-mcp\build\server.js'
if (-not (Test-Path -LiteralPath $NodePath -PathType Leaf)) { throw 'Set -NodePath to the absolute path of node.exe.' }
if (-not (Test-Path -LiteralPath $server -PathType Leaf)) { throw 'Build the workspace before updating Claude.' }
if (-not (Test-Path -LiteralPath (Join-Path $root 'node_modules\@modelcontextprotocol\sdk'))) { throw 'Install dependencies first: npm ci --omit=dev --ignore-scripts' }
if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) { throw 'Claude config not found. Open Claude Settings > Developer > Edit Config, then pass its path with -ConfigPath.' }

$original = [IO.File]::ReadAllText($ConfigPath)
$config = $original | ConvertFrom-Json
$entryProperty = $config.mcpServers.PSObject.Properties[$ServerName]
if ($null -eq $entryProperty) { throw 'Existing KOSIS entry not found. Pass its exact name with -ServerName. No config was changed.' }
$entry = $entryProperty.Value
# Only replace launch command and arguments; retain env, other servers and preferences.
$entry | Add-Member -MemberType NoteProperty -Name command -Value $NodePath -Force
$entry | Add-Member -MemberType NoteProperty -Name args -Value @($server) -Force
$updated = $config | ConvertTo-Json -Depth 100
$null = $updated | ConvertFrom-Json
if ([IO.File]::ReadAllText($ConfigPath) -cne $original) { throw 'Config changed during preparation. Run again.' }
$backup = $ConfigPath + '.backup-' + [DateTime]::Now.ToString('yyyyMMdd-HHmmss-fff')
Copy-Item -LiteralPath $ConfigPath -Destination $backup
$temp = $ConfigPath + '.kosis-' + [Guid]::NewGuid().ToString('N') + '.tmp'
try {
    [IO.File]::WriteAllText($temp, $updated + [Environment]::NewLine, (New-Object Text.UTF8Encoding($false)))
    Move-Item -LiteralPath $temp -Destination $ConfigPath -Force
} finally {
    if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp }
}
Write-Output ('Updated only ' + $ServerName + ' command/args; existing env and other MCP entries retained.')
Write-Output ('Backup: ' + $backup)
Write-Output 'Completely quit Claude Desktop and open it again.'
