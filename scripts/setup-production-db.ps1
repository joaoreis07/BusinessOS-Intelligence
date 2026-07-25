# Applies Supabase migrations + seed to the cloud project and configures Vercel.
#
# Option A — Access Token (recommended):
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#   .\scripts\setup-production-db.ps1
#
# Option B — Database password:
#   $env:SUPABASE_DB_PASSWORD = "your-db-password"
#   $env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_..."   # optional but recommended
#   .\scripts\setup-production-db.ps1

$ErrorActionPreference = "Stop"

$ProjectRef = "iqlgebzkaglzsxhkmpdk"
$AppUrl = "https://businessos-intelligence.vercel.app"
$PoolerHost = "aws-0-us-east-2.pooler.supabase.com"

function Invoke-SeedSql {
  param([string]$DbUrl)
  if (Get-Command psql -ErrorAction SilentlyContinue) {
    psql $DbUrl -v ON_ERROR_STOP=1 -f supabase/seed.sql
    return
  }
  Write-Warning "psql não encontrado. Cole supabase/seed.sql no SQL Editor do Supabase após as migrations."
}

if ($env:SUPABASE_ACCESS_TOKEN) {
  Write-Host ">> Linkando projeto $ProjectRef..."
  npx supabase link --project-ref $ProjectRef

  Write-Host ">> Aplicando migrations..."
  npx supabase db push

  if ($env:SUPABASE_DB_PASSWORD) {
    $DbUrl = "postgresql://postgres.${ProjectRef}:$($env:SUPABASE_DB_PASSWORD)@${PoolerHost}:6543/postgres"
    Write-Host ">> Aplicando seed..."
    Invoke-SeedSql -DbUrl $DbUrl
  } else {
    Write-Warning "SUPABASE_DB_PASSWORD não definida — migrations ok, mas seed/demo vitta-demo ainda precisa da senha do banco ou SQL Editor."
  }
} elseif ($env:SUPABASE_DB_PASSWORD) {
  $DbUrl = "postgresql://postgres.${ProjectRef}:$($env:SUPABASE_DB_PASSWORD)@${PoolerHost}:6543/postgres"
  Write-Host ">> Aplicando migrations via db-url..."
  npx supabase db push --db-url $DbUrl
  Write-Host ">> Aplicando seed..."
  Invoke-SeedSql -DbUrl $DbUrl
} else {
  throw "Defina SUPABASE_ACCESS_TOKEN ou SUPABASE_DB_PASSWORD."
}

if ($env:SUPABASE_SERVICE_ROLE_KEY) {
  Write-Host ">> Configurando SUPABASE_SERVICE_ROLE_KEY na Vercel..."
  $env:SUPABASE_SERVICE_ROLE_KEY | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
  $env:SUPABASE_SERVICE_ROLE_KEY | npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview
  $env:SUPABASE_SERVICE_ROLE_KEY | npx vercel env add SUPABASE_SERVICE_ROLE_KEY development
} else {
  Write-Warning "SUPABASE_SERVICE_ROLE_KEY não definida. Admin/webhooks podem falhar até configurar na Vercel."
}

Write-Host ">> Redeploy produção..."
npx vercel deploy --prod --yes

Write-Host ""
Write-Host "Concluído. Valide:"
Write-Host "  $AppUrl/vitta-demo"
Write-Host ""
Write-Host "Supabase Auth -> URL Configuration:"
Write-Host "  Site URL: $AppUrl"
Write-Host "  Redirect URLs: ${AppUrl}/**"
