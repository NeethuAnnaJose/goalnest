# Creates GoalNest PostgreSQL user/database on local Windows PostgreSQL (non-Docker).
# Run in PowerShell: .\scripts\setup-db-windows.ps1

$psql = @(
  "${env:ProgramFiles}\PostgreSQL\18\bin\psql.exe",
  "${env:ProgramFiles}\PostgreSQL\17\bin\psql.exe",
  "${env:ProgramFiles}\PostgreSQL\16\bin\psql.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $psql) {
  Write-Error "psql not found. Install PostgreSQL or use: docker compose up -d postgres"
  exit 1
}

Write-Host "Using $psql"

& $psql -U postgres -h localhost -v ON_ERROR_STOP=1 -c @"
DO `$`$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'goalnest') THEN
    CREATE ROLE goalnest WITH LOGIN PASSWORD 'goalnest_dev_password' CREATEDB;
  ELSE
    ALTER ROLE goalnest CREATEDB;
  END IF;
END `$`$;
"@

$dbExists = & $psql -U postgres -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname = 'goalnest'"
if (-not $dbExists.Trim()) {
  & $psql -U postgres -h localhost -c "CREATE DATABASE goalnest OWNER goalnest;"
}

& $psql -U postgres -h localhost -d goalnest -c "GRANT ALL ON SCHEMA public TO goalnest; ALTER SCHEMA public OWNER TO goalnest;"

Push-Location "$PSScriptRoot\..\backend"
npx prisma migrate deploy
npx prisma generate
Pop-Location

Write-Host ""
Write-Host "Database ready. Start the API with: cd backend; npm run start:dev"
