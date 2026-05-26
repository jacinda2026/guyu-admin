$ErrorActionPreference = "Stop"

$port = if ($env:VITE_PORT) { [int]$env:VITE_PORT } else { 5173 }
$ips = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.InterfaceAlias -notmatch "Loopback|VirtualBox|VMware"
  } |
  Select-Object -ExpandProperty IPAddress

Write-Host ""
Write-Host "Mobile debug mode" -ForegroundColor Cyan
Write-Host "1. Keep this terminal running on the computer."
Write-Host "2. Connect your phone to the same Wi-Fi."
Write-Host "3. Open one of these URLs on your phone:"

foreach ($ip in $ips) {
  Write-Host "   http://$ip`:$port" -ForegroundColor Green
}

Write-Host ""
Write-Host "If the phone cannot open it, allow Node.js through Windows Firewall for private networks."
Write-Host ""

npm run dev:mobile -- --port $port
