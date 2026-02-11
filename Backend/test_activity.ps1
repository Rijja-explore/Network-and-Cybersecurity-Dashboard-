$testData = @{
    hostname = "TEST-PC"
    cpu_percent = 45.5
    bytes_sent = 1000000
    bytes_recv = 2000000
    processes = @("chrome.exe", "notepad.exe")
    websites = @("google.com", "github.com")
    destinations = @(
        @{ip="8.8.8.8"; port=443; domain="google.com"}
        @{ip="1.1.1.1"; port=53; domain="dns.cloudflare.com"}
    )
} | ConvertTo-Json -Depth 3

Write-Host "`nTesting activity submission..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/activity" -Method POST -Body $testData -ContentType "application/json" -UseBasicParsing
    Write-Host "`n✓ Activity submitted successfully: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Yellow
    $response.Content
} catch {
    Write-Host "`n✗ Error submitting activity: $_" -ForegroundColor Red
}

Write-Host "`n`nChecking if alert was created..." -ForegroundColor Cyan
Start-Sleep -Seconds 1
try {
    $alerts = Invoke-WebRequest -Uri "http://localhost:8000/alerts" -UseBasicParsing
    Write-Host "✓ Alerts retrieved" -ForegroundColor Green
    Write-Host "`nRecent alerts:" -ForegroundColor Yellow
    $alerts.Content | ConvertFrom-Json | Select-Object -ExpandProperty alerts | Select-Object -First 3 | ConvertTo-Json
} catch {
    Write-Host "✗ Error getting alerts: $_" -ForegroundColor Red
}
