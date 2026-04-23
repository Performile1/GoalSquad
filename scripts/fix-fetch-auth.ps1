$root = 'C:\Users\ricka\Documents\Develop\Standalone\Goalsquad'
$targets = @(
  'app\sellers\[id]\dashboard\page.tsx',
  'app\sellers\[id]\orders\page.tsx',
  'app\sellers\[id]\avatar\page.tsx',
  'app\sellers\[id]\avatar\create\page.tsx',
  'app\sellers\analytics\page.tsx',
  'app\sellers\backend\page.tsx',
  'app\sellers\orders\page.tsx',
  'app\sellers\products\page.tsx',
  'app\warehouses\[id]\dashboard\page.tsx',
  'app\warehouses\[id]\orders\page.tsx',
  'app\warehouses\[id]\management\page.tsx',
  'app\warehouses\onboard\page.tsx'
)

$import = "import { apiFetch } from '@/lib/api-client';"
$results = @()

foreach ($rel in $targets) {
  $path = Join-Path $root $rel
  if (-not (Test-Path -LiteralPath $path)) {
    $results += "  SKIP (not found): $rel"
    continue
  }
  $raw = [IO.File]::ReadAllText($path)

  # Skip if no bare fetch() calls
  if ($raw -notmatch "await fetch\(") {
    $results += "  SKIP (no fetch): $rel"
    continue
  }

  # Add import if missing
  if ($raw -notmatch [regex]::Escape("from '@/lib/api-client'")) {
    # Insert after the last consecutive import line block
    $raw = [regex]::Replace($raw, "(?m)(^import [^\n]+\n)(?!import )", '$1' + $import + "`n")
  }

  # Replace: await fetch( -> await apiFetch(
  $new = $raw -replace "(?<!\w)fetch\(", "apiFetch("

  # Remove redundant Content-Type: application/json headers (apiFetch adds it automatically)
  $new = $new -replace "headers:\s*\{\s*'Content-Type':\s*'application/json'\s*\},\s*\r?\n", ""

  if ($new -ne $raw) {
    [IO.File]::WriteAllText($path, $new)
    $results += "  FIXED: $rel"
  } else {
    $results += "  NO CHANGE: $rel"
  }
}

Write-Host "Results:"
$results | ForEach-Object { Write-Host $_ }
