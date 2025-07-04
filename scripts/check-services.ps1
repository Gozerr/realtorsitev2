# Service check script for Real Estate project
Write-Host "Checking Real Estate project services..." -ForegroundColor Green

# Check Docker containers
Write-Host "`nDocker containers status:" -ForegroundColor Yellow
docker-compose ps

# Check service availability
Write-Host "`nService availability check:" -ForegroundColor Yellow

$services = @(
    @{Name="Frontend"; URL="http://localhost:3000"},
    @{Name="Backend API"; URL="http://localhost:3001/api/health"},
    @{Name="pgAdmin"; URL="http://localhost:8080"},
    @{Name="PostgreSQL"; URL="localhost:5432"}
)

foreach ($service in $services) {
    try {
        if ($service.Name -eq "PostgreSQL") {
            # For PostgreSQL use netstat
            $result = netstat -an | Select-String ":5432"
            if ($result) {
                Write-Host "OK $($service.Name): Available" -ForegroundColor Green
            } else {
                Write-Host "FAIL $($service.Name): Not available" -ForegroundColor Red
            }
        } else {
            $response = Invoke-WebRequest -Uri $service.URL -Method Head -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "OK $($service.Name): Available (HTTP $($response.StatusCode))" -ForegroundColor Green
            } else {
                Write-Host "WARN $($service.Name): Response $($response.StatusCode)" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "FAIL $($service.Name): Not available" -ForegroundColor Red
    }
}

# Check logs for errors
Write-Host "`nRecent errors in logs:" -ForegroundColor Yellow
docker-compose logs --tail=10 | Select-String -Pattern "ERROR|error|Error" -Context 0,1

Write-Host "`nCheck completed!" -ForegroundColor Green
Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  docker-compose logs [service] - service logs" -ForegroundColor White
Write-Host "  docker-compose restart [service] - restart service" -ForegroundColor White
Write-Host "  docker-compose down && docker-compose up -d - full rebuild" -ForegroundColor White 