# Stop all SABYCUT local server processes
$ports = @(8080, 5000, 3000, 3001)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            if ($p -gt 0) {
                Write-Host "Stopping process PID $p on port $port..."
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            }
        }
    }
}
Write-Host "All SABYCUT ports (8080, 5000, 3000) are free."
