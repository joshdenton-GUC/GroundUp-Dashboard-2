# ================================================
# SUPABASE DATABASE MIGRATIONS DEPLOYMENT SCRIPT (PowerShell)
# ================================================
# This script deploys all database migrations
# to your remote Supabase project
# ================================================

$ErrorActionPreference = "Stop"

Write-Host "`n🗄️  Starting Database Migrations Deployment" -ForegroundColor Blue
Write-Host "==============================================" -ForegroundColor Blue
Write-Host ""

# Check if supabase CLI is available
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "❌ Supabase CLI is not installed" -ForegroundColor Red
    Write-Host "Please install it from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or use npx: npx supabase@latest" -ForegroundColor Yellow
    Write-Host "See WINDOWS_INSTALLATION.md for detailed instructions" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Check if linked to remote project
if (-not (Test-Path ".supabase/config.toml")) {
    Write-Host "🔗 Linking to remote project..." -ForegroundColor Blue
    Write-Host "Project ID from config: vpvvcwvebjtibafsceqx"
    supabase link --project-ref vpvvcwvebjtibafsceqx
    Write-Host ""
}

Write-Host "⚠️  WARNING: This will apply migrations to your production database" -ForegroundColor Yellow
Write-Host "Make sure you have a backup before proceeding!" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue with migration? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "📤 Pushing migrations to remote database..." -ForegroundColor Blue
Write-Host ""

# Push migrations
try {
    supabase db push
    Write-Host ""
    Write-Host "✅ All migrations applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "==============================================" -ForegroundColor Blue
    Write-Host "📊 Migration Summary" -ForegroundColor Blue
    Write-Host "==============================================" -ForegroundColor Blue

    # Count migration files
    $migrationCount = (Get-ChildItem -Path "supabase/migrations/*.sql" -ErrorAction SilentlyContinue).Count
    Write-Host "Total migration files: $migrationCount"
    Write-Host ""

    Write-Host "Recent migrations:"
    Get-ChildItem -Path "supabase/migrations/*.sql" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 5 |
        ForEach-Object { Write-Host "  $($_.Name)" }
}
catch {
    Write-Host ""
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check if you're linked to the correct project:"
    Write-Host "   supabase projects list"
    Write-Host ""
    Write-Host "2. Verify your database connection:"
    Write-Host "   supabase db remote show"
    Write-Host ""
    Write-Host "3. Check for migration errors:"
    Write-Host "   supabase db diff"
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Blue
Write-Host "🔍 Next Steps:" -ForegroundColor Blue
Write-Host "==============================================" -ForegroundColor Blue
Write-Host "1. Verify database schema in Supabase Dashboard:"
Write-Host "   https://supabase.com/dashboard/project/vpvvcwvebjtibafsceqx/editor"
Write-Host ""
Write-Host "2. Test your tables:"
Write-Host "   - profiles"
Write-Host "   - clients"
Write-Host "   - candidates"
Write-Host "   - job_posts"
Write-Host "   - email_alerts"
Write-Host ""
Write-Host "3. Check RLS policies are enabled"
Write-Host ""
Write-Host "✅ Migration deployment complete!" -ForegroundColor Green
