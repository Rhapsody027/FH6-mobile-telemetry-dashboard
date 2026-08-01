param(
	[Parameter(Mandatory = $true)]
	[string]$Version,
	[switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = Resolve-Path $PSScriptRoot
$buildScript = Join-Path $projectRoot "build_windows_installer.ps1"
$artifactsRoot = Join-Path $projectRoot "out"
$bundleRoot = Join-Path $artifactsRoot "windows-installer\hub\Time4ttack-FH6-Hub"
$installerRoot = Join-Path $artifactsRoot "installer"
$releaseRoot = Join-Path $projectRoot "release\windows\$Version"

if (-not $SkipBuild) {
	Write-Host "[Release] Running build pipeline..."
	& $buildScript -AppVersion $Version
	if ($LASTEXITCODE -ne 0) {
		throw "Build pipeline failed."
	}
}

if (-not (Test-Path $bundleRoot)) {
	throw "Bundle not found: $bundleRoot"
}

if (Test-Path $releaseRoot) {
	Remove-Item -Path $releaseRoot -Recurse -Force
}

$bundleReleaseRoot = Join-Path $releaseRoot "bundle"
$installerReleaseRoot = Join-Path $releaseRoot "installer"

New-Item -ItemType Directory -Force -Path $bundleReleaseRoot | Out-Null
New-Item -ItemType Directory -Force -Path $installerReleaseRoot | Out-Null

Copy-Item -Path $bundleRoot -Destination (Join-Path $bundleReleaseRoot "Time4ttack-FH6-Hub") -Recurse -Force

$zipPath = Join-Path $bundleReleaseRoot "Time4ttack-FH6-Hub-$Version-bundle.zip"
if (Test-Path $zipPath) {
	Remove-Item $zipPath -Force
}

Compress-Archive -Path (Join-Path $bundleReleaseRoot "Time4ttack-FH6-Hub\*") -DestinationPath $zipPath -CompressionLevel Optimal

$installerPath = Join-Path $installerRoot "Time4ttack-FH6-Hub-Setup.exe"
if (Test-Path $installerPath) {
	Copy-Item -Path $installerPath -Destination (Join-Path $installerReleaseRoot "Time4ttack-FH6-Hub-$Version-Setup.exe") -Force
}

$hashFile = Join-Path $releaseRoot "SHA256SUMS.txt"
$hashItems = Get-ChildItem -Path $releaseRoot -File -Recurse
$lines = @()
foreach ($item in $hashItems) {
	$hash = Get-FileHash -Path $item.FullName -Algorithm SHA256
	$relativePath = $item.FullName.Substring($releaseRoot.Length + 1).Replace("\", "/")
	$lines += "{0}  {1}" -f $hash.Hash.ToLowerInvariant(), $relativePath
}

Set-Content -Path $hashFile -Value $lines -Encoding utf8

$notesTemplateSource = Join-Path $projectRoot "release\RELEASE_NOTES_TEMPLATE.md"
if (Test-Path $notesTemplateSource) {
	Copy-Item -Path $notesTemplateSource -Destination (Join-Path $releaseRoot "RELEASE_NOTES.md") -Force
}

Write-Host "[Release] Prepared release artifacts in: $releaseRoot"