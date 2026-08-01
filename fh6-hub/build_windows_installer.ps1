param(
	[string]$AppVersion = "0.1.0"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = Resolve-Path $PSScriptRoot
$launcherPath = Join-Path $projectRoot "launcher.py"
$watcherPath = Join-Path $projectRoot "fh6_watcher.py"
$installerScript = Join-Path $projectRoot "installer\Time4ttackFH6Hub.iss"
$artifactsRoot = Join-Path $projectRoot "out"
$distRoot = Join-Path $artifactsRoot "windows-installer\hub"
$workRoot = Join-Path $artifactsRoot "pyinstaller-work"
$installerOutputRoot = Join-Path $artifactsRoot "installer"

New-Item -ItemType Directory -Force -Path $artifactsRoot | Out-Null
New-Item -ItemType Directory -Force -Path $distRoot | Out-Null
New-Item -ItemType Directory -Force -Path $workRoot | Out-Null
New-Item -ItemType Directory -Force -Path $installerOutputRoot | Out-Null

Write-Host "[Build] Packing Hub EXE with PyInstaller..."
& uv run --with pyinstaller pyinstaller `
	--noconfirm `
	--clean `
	--windowed `
	--name "Time4ttack-FH6-Hub" `
	--distpath $distRoot `
	--workpath $workRoot `
	--specpath $workRoot `
	--collect-all PIL `
	--collect-all pystray `
	--collect-all qrcode `
	--collect-all websockets `
	--collect-all zeroconf `
	--collect-all colorama `
	$launcherPath

if ($LASTEXITCODE -ne 0) {
	throw "PyInstaller build failed."
}

Write-Host "[Build] Packing FH6 watcher EXE..."
& uv run --with pyinstaller pyinstaller `
	--noconfirm `
	--clean `
	--onefile `
	--windowed `
	--name "Time4ttack-FH6-Watcher" `
	--distpath $distRoot `
	--workpath $workRoot `
	--specpath $workRoot `
	$watcherPath

if ($LASTEXITCODE -ne 0) {
	throw "Watcher build failed."
}

$bundleRoot = Join-Path $distRoot "Time4ttack-FH6-Hub"
$builtExe = Join-Path $bundleRoot "Time4ttack-FH6-Hub.exe"
if (-not (Test-Path $builtExe)) {
	throw "Expected packaged executable was not found: $builtExe"
}

$watcherExe = Join-Path $distRoot "Time4ttack-FH6-Watcher.exe"
if (-not (Test-Path $watcherExe)) {
	throw "Expected watcher executable was not found: $watcherExe"
}

Copy-Item -Path $watcherExe -Destination (Join-Path $bundleRoot "Time4ttack-FH6-Watcher.exe") -Force

Write-Host "[Build] Packaged bundle: $bundleRoot"

$iscc = Get-Command ISCC.exe -ErrorAction SilentlyContinue
if (-not $iscc) {
	Write-Warning "Inno Setup was not found. Installer packaging was skipped."
	Write-Host "[Build] Use the packaged bundle directly or install Inno Setup to build the installer."
	return
}

Write-Host "[Build] Building Inno Setup installer..."
& $iscc.Source `
	"/DSourceDir=$bundleRoot" `
	"/DOutputDir=$installerOutputRoot" `
	"/DAppVersionOverride=$AppVersion" `
	$installerScript

if ($LASTEXITCODE -ne 0) {
	throw "Inno Setup installer build failed."
}

Write-Host "[Build] Installer output: $installerOutputRoot"