# Install the discli Discord CLI and verify it with `discli doctor`.
# The bot token is read from the environment or ~/.discli/config.json, never here.
# Usage: setup-discli.ps1 [-DryRun]
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (Get-Variable PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

$package = 'discord-cli-agent'

function Fail([string] $Message, [int] $Code) {
    [Console]::Error.WriteLine("setup-discli: $Message")
    exit $Code
}

$dryRun = $false
foreach ($arg in $args) {
    if ($arg -in @('-DryRun', '--dry-run')) { $dryRun = $true }
    else { Fail "unknown argument: $arg" 2 }
}

$installer = $null
if (Get-Command pipx -ErrorAction SilentlyContinue) { $installer = 'pipx' }
elseif (Get-Command python -ErrorAction SilentlyContinue) { $installer = 'python' }
elseif (Get-Command py -ErrorAction SilentlyContinue) { $installer = 'py' }

if (-not $installer) {
    Fail 'install Python 3.10 or newer, or pipx, first.' 1
}

$plan = switch ($installer) {
    'pipx'   { 'pipx install discord-cli-agent' }
    'python' { 'python -m pip install --user discord-cli-agent' }
    'py'     { 'py -m pip install --user discord-cli-agent' }
}

if ($dryRun) {
    Write-Host "dry-run: $plan"
    Write-Host 'dry-run: discli doctor'
    exit 0
}

switch ($installer) {
    'pipx'   { & pipx install $package }
    'python' { & python -m pip install --user $package }
    'py'     { & py -m pip install --user $package }
}
if ($LASTEXITCODE -ne 0) {
    Fail "install failed (exit $LASTEXITCODE)." 1
}

if (-not (Get-Command discli -ErrorAction SilentlyContinue)) {
    Fail 'discli is not on PATH after install. Add the Python Scripts directory to PATH.' 1
}

& discli doctor
exit $LASTEXITCODE
