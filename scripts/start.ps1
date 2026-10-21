param(
    [switch]$OpenBrowser,
    [int]$Port = 5173,
    [int]$OwnerProcessId = 0,
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\downloads\voice.starbow.top\source'))
$appMarker = '<meta name="voice-tuning-app" content="local-integrated">'

function Test-OurServer([int]$CandidatePort) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$CandidatePort/" -UseBasicParsing -TimeoutSec 1
        return $response.StatusCode -eq 200 -and $response.Content.Contains($appMarker)
    } catch { return $false }
}

function Test-FreePort([int]$CandidatePort) {
    $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $CandidatePort)
    try { $listener.Start(); return $true } catch { return $false } finally { $listener.Stop() }
}

function Test-LocalProxy {
    $client = [Net.Sockets.TcpClient]::new()
    try {
        $pending = $client.BeginConnect('127.0.0.1', 7890, $null, $null)
        if (-not $pending.AsyncWaitHandle.WaitOne(600)) { return $false }
        $client.EndConnect($pending)
        return $true
    } catch { return $false } finally { $client.Dispose() }
}

# 浏览器只在本项目页面就绪后打开；主进程结束时，等待程序也随之结束。
if ($OpenBrowser) {
    for ($attempt = 0; $attempt -lt 90; $attempt++) {
        if (-not (Get-Process -Id $OwnerProcessId -ErrorAction SilentlyContinue)) { exit 0 }
        if (Test-OurServer $Port) {
            Start-Process "http://127.0.0.1:$Port/"
            exit 0
        }
        Start-Sleep -Milliseconds 700
    }
    exit 0
}

try {
    Write-Host ''
    Write-Host '声音练习室 · 本地启动' -ForegroundColor Cyan
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'package.json'))) {
        throw '找不到练习器源码，请保留 scripts 与 downloads 的相对目录结构。'
    }
    $node = Get-Command 'node.exe' -ErrorAction SilentlyContinue
    $npm = Get-Command 'npm.cmd' -ErrorAction SilentlyContinue
    if (-not $node -or -not $npm) {
        throw '未找到 Node.js / npm。请先安装 Node.js 22.12 或更新的 LTS 版本，再重新双击启动。'
    }
    $nodeVersion = (& $node.Source --version).Trim().TrimStart('v')
    $version = [Version]$nodeVersion
    if (($version.Major -lt 20) -or ($version.Major -eq 21) -or ($version.Major -eq 20 -and $version.Minor -lt 19) -or ($version.Major -eq 22 -and $version.Minor -lt 12)) {
        throw "当前 Node.js $nodeVersion 过旧，请安装 Node.js 22.12 或更新的 LTS 版本。"
    }
    $lockPath = Join-Path $projectRoot 'package-lock.json'
    if (-not (Test-Path -LiteralPath $lockPath)) { throw '缺少 package-lock.json，无法可靠安装依赖。' }
    $lockContent = Get-Content -LiteralPath $lockPath -Raw -Encoding UTF8
    $lockCachePath = Join-Path $projectRoot 'node_modules\.voice-tuning-package-lock.json'
    $vitePath = Join-Path $projectRoot 'node_modules\vite\bin\vite.js'
    $needsInstall = -not (Test-Path -LiteralPath $vitePath) -or -not (Test-Path -LiteralPath $lockCachePath)
    if (-not $needsInstall) {
        $cachedLock = Get-Content -LiteralPath $lockCachePath -Raw -Encoding UTF8
        $needsInstall = -not [string]::Equals($lockContent, $cachedLock, [StringComparison]::Ordinal)
    }

    # 先识别正在运行的练习器，避免重复启动，也避免打开其它项目占用的端口。
    $selectedPort = 0
    for ($candidate = 5173; $candidate -le 5192; $candidate++) {
        if (Test-FreePort $candidate) {
            if ($selectedPort -eq 0) { $selectedPort = $candidate }
        } elseif (Test-OurServer $candidate) {
            Write-Host "练习器已经运行：http://127.0.0.1:$candidate/" -ForegroundColor Green
            if (-not $CheckOnly) { Start-Process "http://127.0.0.1:$candidate/" }
            exit 0
        }
    }
    if ($selectedPort -eq 0) { throw '5173–5192 端口均被占用，请关闭不用的本地开发服务后重试。' }
    if ($CheckOnly) {
        Write-Host "环境检查通过：Node.js $nodeVersion；可用端口 $selectedPort；需要安装依赖：$needsInstall"
        exit 0
    }

    Push-Location -LiteralPath $projectRoot
    try {
        if ($needsInstall) {
            Write-Host '首次启动或依赖清单有变化，正在安装本项目依赖……'
            $npmArgs = @('ci', '--no-audit', '--no-fund')
            if (Test-LocalProxy) {
                $npmArgs += @('--proxy=http://127.0.0.1:7890', '--https-proxy=http://127.0.0.1:7890')
                Write-Host '本次安装使用本地代理 127.0.0.1:7890。'
            }
            & $npm.Source @npmArgs
            if ($LASTEXITCODE -ne 0) { throw '依赖安装失败，请检查网络或本地代理，再重新启动。' }
            [IO.File]::WriteAllText($lockCachePath, $lockContent, [Text.UTF8Encoding]::new($false))
        }
        if (-not (Test-Path -LiteralPath $vitePath)) { throw '找不到 Vite，依赖可能未完整安装。' }
        $launchArgs = @('-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $PSCommandPath + '"'), '-OpenBrowser', '-Port', $selectedPort, '-OwnerProcessId', $PID)
        $browserHelper = Start-Process -FilePath 'powershell.exe' -ArgumentList $launchArgs -WindowStyle Hidden -PassThru
        try {
            Write-Host "即将打开 http://127.0.0.1:$selectedPort/" -ForegroundColor Green
            Write-Host '保留这个窗口即可使用；按 Ctrl+C 停止练习器。'
            & $node.Source $vitePath --host 127.0.0.1 --port $selectedPort --strictPort
            if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne -1073741510 -and $LASTEXITCODE -ne 130) {
                throw "练习器异常退出（退出码 $LASTEXITCODE）。"
            }
        } finally {
            if (-not $browserHelper.HasExited) { Stop-Process -Id $browserHelper.Id -ErrorAction SilentlyContinue }
        }
    } finally { Pop-Location }
} catch {
    Write-Host ''
    Write-Host ('启动失败：' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
