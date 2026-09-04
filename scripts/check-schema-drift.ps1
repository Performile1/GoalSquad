<#
.SYNOPSIS
  Schema-vs-code drift detector (DATABASE_INTEGRITY_AUDIT.md, Fas 0/8).

.DESCRIPTION
  Compares the set of tables defined in supabase/migrations with the set of
  tables referenced via `.from('<table>')` in app/ and lib/. Fails (exit 1)
  if the code references a table that has no CREATE TABLE in migrations.

  Known valid exceptions (views / external schema) are listed in $Allowlist.

.EXAMPLE
  pwsh scripts/check-schema-drift.ps1
#>

param(
  [string]$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
)

$ErrorActionPreference = 'Stop'

$migrationFiles = Get-ChildItem -File (Join-Path $RepoRoot 'supabase/migrations') -Filter '*.sql'
$migrationNumbers = $migrationFiles | ForEach-Object {
  if ($_.BaseName -match '^(\d+)_') { [int]$Matches[1] }
}
$duplicateNumbers = $migrationNumbers | Group-Object | Where-Object Count -gt 1
if ($duplicateNumbers) {
  Write-Host "`nDUPLICATE MIGRATION NUMBERS DETECTED:" -ForegroundColor Red
  $duplicateNumbers | ForEach-Object { Write-Host "  - $($_.Name): $($_.Count) files" -ForegroundColor Red }
  exit 1
}

# Views and intentionally-external relations that have no CREATE TABLE.
$Allowlist = @(
  'public',                  # schema-qualified false positive
  'public_merchants',        # view (065_public_safe_views.sql)
  'payout_analytics_rollup', # view (072_stripe_connect_risk_management.sql)
  'product_flow_summary'     # view
)

Write-Host "Scanning migrations for CREATE TABLE definitions..." -ForegroundColor Cyan
$defined = Get-ChildItem -Recurse -Include *.sql (Join-Path $RepoRoot 'supabase/migrations') |
  Select-String 'CREATE TABLE(\s+IF NOT EXISTS)?\s+(public\.)?(\w+)' -AllMatches |
  ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[3].Value } |
  Sort-Object -Unique

# Include views as "defined" so they don't trip the check.
$views = Get-ChildItem -Recurse -Include *.sql (Join-Path $RepoRoot 'supabase/migrations') |
  Select-String 'CREATE\s+(OR REPLACE\s+)?VIEW\s+(public\.)?(\w+)' -AllMatches |
  ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[3].Value } |
  Sort-Object -Unique

$defined = @($defined) + @($views) + $Allowlist | Sort-Object -Unique

Write-Host "Scanning code for .from('<table>') references..." -ForegroundColor Cyan
$used = Get-ChildItem -Recurse -Include *.ts,*.tsx (Join-Path $RepoRoot 'app'),(Join-Path $RepoRoot 'lib') |
  Select-String "\.from\(['""](\w+)['""]\)" -AllMatches |
  ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[1].Value } |
  Sort-Object -Unique

$missing = $used | Where-Object { $defined -notcontains $_ }

if ($missing) {
  Write-Host "`nSCHEMA DRIFT DETECTED — code references tables with no migration:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  Write-Host "`nEither add a migration that defines the table, or fix the .from() call." -ForegroundColor Yellow
  exit 1
}

Write-Host "`nOK: every code-referenced table has a migration or is allowlisted." -ForegroundColor Green
exit 0
