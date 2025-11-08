# ================================================
# SUPABASE EDGE FUNCTIONS DEPLOYMENT SCRIPT (PowerShell)
# ================================================
# This script deploys all Supabase Edge Functions
# to your remote Supabase project
# ================================================

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 Starting Supabase Edge Functions Deployment" -ForegroundColor Blue
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

Write-Host "📦 Deploying Edge Functions..." -ForegroundColor Blue
Write-Host ""

# List of all edge functions to deploy
$functions = @(
    "send-email-alert",
    "notify-client",
    "notify-new-client",
    "send-reminder-emails",
    "resend-client-invitation",
    "resend-webhook",
    "stripe-webhook",
    "parse-resume",
    "invite-client",
    "manage-api-keys",
    "audit-log",
    "create-payment-intent",
    "auto-reminder-trigger",
    "get-clients-with-status"
)

# Counters
$successCount = 0
$failCount = 0
$failedFunctions = @()

# Deploy each function
foreach ($func in $functions) {
    Write-Host "Deploying: $func" -ForegroundColor Blue

    try {
        supabase functions deploy $func --no-verify-jwt
        Write-Host "✓ Successfully deployed: $func" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "✗ Failed to deploy: $func" -ForegroundColor Red
        $failCount++
        $failedFunctions += $func
    }
    Write-Host ""
}

# Summary
Write-Host "==============================================" -ForegroundColor Blue
Write-Host "📊 Deployment Summary" -ForegroundColor Blue
Write-Host "==============================================" -ForegroundColor Blue
Write-Host "✓ Successful: $successCount" -ForegroundColor Green

if ($failCount -gt 0) {
    Write-Host "✗ Failed: $failCount" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed functions:" -ForegroundColor Yellow
    foreach ($func in $failedFunctions) {
        Write-Host "  - $func" -ForegroundColor Yellow
    }
}
else {
    Write-Host "✓ All functions deployed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Blue
Write-Host "🔐 Next Steps:" -ForegroundColor Blue
Write-Host "==============================================" -ForegroundColor Blue
Write-Host "1. Set environment secrets (if not already set):"
Write-Host "   supabase secrets set RESEND_API_KEY=re_your_key"
Write-Host "   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key"
Write-Host "   supabase secrets set VITE_APP_URL=https://groundupcareers.app"
Write-Host ""
Write-Host "2. Verify secrets:"
Write-Host "   supabase secrets list"
Write-Host ""
Write-Host "3. Test a function:"
Write-Host "   supabase functions logs send-email-alert"
Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
