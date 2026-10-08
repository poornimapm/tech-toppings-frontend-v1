# Use this repository's Node version (.node-version, Node 24) in the CURRENT PowerShell session.
# Other terminals and projects keep using your system Node.
#
# Usage (note the leading dot):   . .\scripts\use-node.ps1
if (-not (Get-Command fnm -ErrorAction SilentlyContinue)) {
    throw "fnm is not installed. Install it with: winget install --id Schniz.fnm -e --scope user"
}
fnm env --shell powershell | Out-String | Invoke-Expression
fnm use --install-if-missing
Write-Host "Using Node $(node --version) for $(Split-Path -Leaf (Get-Location))"
