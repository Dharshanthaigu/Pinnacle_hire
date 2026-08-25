$email = Read-Host "Poster email"
$password = Read-Host "Poster password"
$jobId = Read-Host "Job ID (from the URL)"

$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResp.token
Write-Host "`nToken acquired." -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token" }

$job = Invoke-RestMethod -Uri "http://localhost:5002/api/jobs/$jobId" -Headers $headers
Write-Host "`nJob status: $($job.status)"
Write-Host "Commission paid: $($job.commission.paid)"

if ($job.commission.paid -eq $true) {
    Write-Host "`nAlready paid. Nothing to test." -ForegroundColor Yellow
    exit
}

Write-Host "`nCreating checkout session..." -ForegroundColor Cyan
$session = Invoke-RestMethod -Uri "http://localhost:5002/api/jobs/$jobId/resume-payment" -Method Patch -Headers $headers

Write-Host "`n=== OPEN THIS URL IN YOUR BROWSER AND PAY WITH 4242 4242 4242 4242 ===" -ForegroundColor Yellow
Write-Host $session.checkoutUrl -ForegroundColor White
Write-Host "=========================================================`n"

Write-Host "Now polling job status every 2s. Watch for it flip to paid." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop once you see the result.`n"

$attempts = 0
while ($true) {
    Start-Sleep -Seconds 2
    $attempts++
    $current = Invoke-RestMethod -Uri "http://localhost:5002/api/jobs/$jobId" -Headers $headers
    $ts = Get-Date -Format "HH:mm:ss"
    Write-Host "[$ts] attempt $attempts - status: $($current.status) - commission.paid: $($current.commission.paid)"
    if ($current.commission.paid -eq $true) {
        Write-Host "`nPAID CONFIRMED. Stopped polling." -ForegroundColor Green
        break
    }
    if ($attempts -ge 60) {
        Write-Host "`n2 minutes passed with no change - payment never registered." -ForegroundColor Red
        break
    }
}
