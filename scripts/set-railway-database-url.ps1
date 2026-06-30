# Supabase Postgres URI를 Railway softpoint-api 의 DATABASE_URL 로 설정합니다.
param(
  [switch]$Prompt,
  [string]$Password = $env:SUPABASE_DB_PASSWORD,
  [string]$ProjectRef = $(if ($env:SUPABASE_PROJECT_REF) { $env:SUPABASE_PROJECT_REF } else { 'cjqykyeqhoqlxnuzuatu' }),
  [string]$Service = 'softpoint-api',
  [ValidateSet('transaction', 'session', 'direct')]
  [string]$Mode = 'transaction'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent

if ($Prompt -or [string]::IsNullOrWhiteSpace($Password)) {
  $secure = Read-Host 'Supabase Database password' -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

if ([string]::IsNullOrWhiteSpace($Password)) { throw 'Password required.' }

$encoded = [uri]::EscapeDataString($Password)
switch ($Mode) {
  'transaction' { $url = "postgresql://postgres.${ProjectRef}:${encoded}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" }
  'session'     { $url = "postgresql://postgres.${ProjectRef}:${encoded}@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" }
  'direct'      { $url = "postgresql://postgres:${encoded}@db.${ProjectRef}.supabase.co:5432/postgres" }
}

Write-Host "Setting DATABASE_URL on Railway '$Service' (ref=$ProjectRef) ..."
Push-Location $repoRoot
try {
  $url | npx @railway/cli variables set DATABASE_URL --stdin -s $Service
  Write-Host 'Done. Redeploy: npx @railway/cli up -s softpoint-api -d'
} finally { Pop-Location }
