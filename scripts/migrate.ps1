<#
.SYNOPSIS
  Applies Supabase migrations against a configurable PostgreSQL schema.

.DESCRIPTION
  Reads VITE_DB_SCHEMA from the .env file in the project root (defaults to "public"),
  substitutes all schema references in the migration SQL files, then executes each
  file in chronological order via the Supabase CLI.

  Each group running a demo should set VITE_DB_SCHEMA to a unique identifier in their
  .env file (e.g. grupo_a, grupo_b) so migrations never conflict within the same
  Supabase project.

.PARAMETER DryRun
  Print the substituted SQL to stdout without executing anything.

.EXAMPLE
  # Normal run — reads .env from repo root
  .\scripts\migrate.ps1

.EXAMPLE
  # Preview substituted SQL without executing
  .\scripts\migrate.ps1 -DryRun
#>

[CmdletBinding()]
param(
    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# 1. Locate project root (parent of the scripts/ folder)
# ---------------------------------------------------------------------------
$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# ---------------------------------------------------------------------------
# 2. Load .env
# ---------------------------------------------------------------------------
$envFile = Join-Path $projectRoot '.env'
if (-not (Test-Path $envFile)) {
    Write-Error ".env not found at $envFile. Copy .env.example to .env and fill in the values."
}

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line -match '^([^=]+)=(.*)$') {
        $key   = $Matches[1].Trim()
        $value = $Matches[2].Trim().Trim('"').Trim("'")
        [Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}

# ---------------------------------------------------------------------------
# 3. Resolve schema name
# ---------------------------------------------------------------------------
$schema = [Environment]::GetEnvironmentVariable('VITE_DB_SCHEMA', 'Process')
if ([string]::IsNullOrWhiteSpace($schema)) { $schema = 'public' }

# Basic validation — only letters, digits, and underscores allowed
if ($schema -notmatch '^[a-zA-Z_][a-zA-Z0-9_]*$') {
    Write-Error "VITE_DB_SCHEMA '$schema' is not a valid PostgreSQL identifier."
}

Write-Host "Target schema: $schema" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# 4. Locate migration files (chronological order)
# ---------------------------------------------------------------------------
$migrationsDir = Join-Path $projectRoot 'supabase\migrations'
$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter '*.sql' |
                  Sort-Object Name

if ($migrationFiles.Count -eq 0) {
    Write-Warning "No migration files found in $migrationsDir"
    exit 0
}

# ---------------------------------------------------------------------------
# 5. Build the preamble that runs once before all migrations
# ---------------------------------------------------------------------------
$preamble = @"
-- Auto-generated preamble by scripts/migrate.ps1
-- Schema: $schema

-- 1. Create schema
CREATE SCHEMA IF NOT EXISTS $schema;

-- 2. Expose schema to Supabase data APIs
--    (mirrors the manual "Exposed schemas" toggle in API settings)
GRANT USAGE ON SCHEMA $schema TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA $schema TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA $schema TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA $schema TO anon, authenticated, service_role;

-- 3. Apply same grants to objects created in future migrations
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA $schema GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA $schema GRANT ALL ON ROUTINES  TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA $schema GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

SET search_path TO $schema, public;

"@

if ($schema -ne 'public' -and -not $DryRun) {
    Write-Host ""
    Write-Host "  REMINDER: add '$schema' to the Exposed Schemas list in the" -ForegroundColor Yellow
    Write-Host "  Supabase dashboard → Project Settings → API → Exposed Schemas" -ForegroundColor Yellow
    Write-Host ""
}

# ---------------------------------------------------------------------------
# 6. Helper: substitute all hardcoded "public" schema references
# ---------------------------------------------------------------------------
function Convert-Schema {
    param([string] $sql, [string] $targetSchema)

    if ($targetSchema -eq 'public') { return $sql }

    # Qualified object references: public.<identifier>
    $sql = $sql -replace '\bpublic\.', "$targetSchema."

    # Schema name inside string literals used by catalog queries / policies
    # e.g. schemaname='public'  OR  schemaname = 'public'
    $sql = $sql -replace "schemaname\s*=\s*'public'", "schemaname = '$targetSchema'"

    # pg_policies / pg_namespace references inside DO blocks
    $sql = $sql -replace "AND\s+schemaname\s*=\s*'public'", "AND schemaname = '$targetSchema'"

    return $sql
}

# ---------------------------------------------------------------------------
# 7. Process and execute each migration
# ---------------------------------------------------------------------------
$tempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "kiple_migrate_$([System.Guid]::NewGuid().ToString('N'))")
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    # Write preamble as the first "migration"
    $preambleFile = Join-Path $tempDir '00000000000000_preamble.sql'
    $preamble | Out-File -FilePath $preambleFile -Encoding UTF8

    foreach ($file in $migrationFiles) {
        $raw  = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $sql  = Convert-Schema -sql $raw -targetSchema $schema
        $dest = Join-Path $tempDir $file.Name
        $sql  | Out-File -FilePath $dest -Encoding UTF8
    }

    $allFiles = Get-ChildItem -Path $tempDir -Filter '*.sql' | Sort-Object Name

    foreach ($f in $allFiles) {
        Write-Host "  -> $($f.Name)" -ForegroundColor Gray

        if ($DryRun) {
            Write-Host (Get-Content $f.FullName -Raw) -ForegroundColor DarkYellow
            continue
        }

        # supabase db query reads SQL from stdin.
        # Run from the project root so the CLI finds supabase/config.toml.
        Push-Location $projectRoot
        try {
            $sqlContent = Get-Content $f.FullName -Raw -Encoding UTF8
            $sqlContent | npx supabase db query --linked
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Migration failed for $($f.Name) (exit code $LASTEXITCODE)."
            }
        }
        finally {
            Pop-Location
        }
    }

    if (-not $DryRun) {
        Write-Host "`nAll migrations applied to schema '$schema'." -ForegroundColor Green
    }

    # -------------------------------------------------------------------------
    # 8. Seeds
    # -------------------------------------------------------------------------
    $seedsDir  = Join-Path $projectRoot 'supabase\seeds'
    $seedFiles = Get-ChildItem -Path $seedsDir -Filter '*.sql' -ErrorAction SilentlyContinue |
                 Sort-Object Name

    if ($seedFiles.Count -gt 0) {
        Write-Host "`nRunning seeds..." -ForegroundColor Cyan

        foreach ($file in $seedFiles) {
            $raw  = Get-Content -Path $file.FullName -Raw -Encoding UTF8
            $sql  = Convert-Schema -sql $raw -targetSchema $schema
            $dest = Join-Path $tempDir "seed_$($file.Name)"
            $sql  | Out-File -FilePath $dest -Encoding UTF8
        }

        $allSeedFiles = Get-ChildItem -Path $tempDir -Filter 'seed_*.sql' | Sort-Object Name

        foreach ($f in $allSeedFiles) {
            Write-Host "  -> $($f.Name -replace '^seed_','')" -ForegroundColor Gray

            if ($DryRun) {
                Write-Host (Get-Content $f.FullName -Raw) -ForegroundColor DarkYellow
                continue
            }

            Push-Location $projectRoot
            try {
                $sqlContent = Get-Content $f.FullName -Raw -Encoding UTF8
                $sqlContent | npx supabase db query --linked
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "Seed failed for $($f.Name -replace '^seed_','') (exit code $LASTEXITCODE)."
                }
            }
            finally {
                Pop-Location
            }
        }

        if (-not $DryRun) {
            Write-Host "All seeds applied to schema '$schema'." -ForegroundColor Green
        }
    }
}
finally {
    Remove-Item -Recurse -Force $tempDir
}
