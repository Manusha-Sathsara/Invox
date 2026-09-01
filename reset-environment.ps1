# INVOX SaaS - Full Environment Reset Script
# Deletes all Sub-Organizations from Asgardeo and truncates PostgreSQL database tables

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "       INVOX SaaS - Environment Reset Tool           " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Asgardeo M2M Credentials
$rootOrg = "pixelaura"
$clientId = "R9er12n1oHfHXc_N23PYD6CHe88a"
$clientSecret = "NU5gIvqd3cGGtjv_kxG6dfr6X3Uzefhp3zIdEO6qDp0a"
$tokenEndpoint = "https://api.asgardeo.io/t/$rootOrg/oauth2/token"
$orgsEndpoint = "https://api.asgardeo.io/t/$rootOrg/api/server/v1/organizations"

Write-Host "`n[1/2] Connecting to Asgardeo Cloud IAM..." -ForegroundColor Yellow

$scopeStr = "internal_organization_create internal_organization_view internal_organization_delete internal_shared_application_create internal_shared_application_view internal_user_mgt_create internal_user_mgt_view"

try {
    $tokenRes = Invoke-RestMethod -Uri $tokenEndpoint -Method Post -Body @{
        grant_type = "client_credentials"
        client_id = $clientId
        client_secret = $clientSecret
        scope = $scopeStr
    }

    $hdrs = @{
        Authorization = "Bearer $($tokenRes.access_token)"
        "Content-Type" = "application/json"
    }

    $orgs = Invoke-RestMethod -Uri $orgsEndpoint -Headers $hdrs -Method Get
    $count = if ($orgs.organizations) { $orgs.organizations.Count } else { 0 }
    Write-Host "Found $count sub-organization(s) in Asgardeo." -ForegroundColor Green

    foreach ($org in $orgs.organizations) {
        Write-Host "  -> Deleting Sub-Organization: '$($org.name)' (ID: $($org.id))..." -ForegroundColor Yellow
        try {
            Invoke-RestMethod -Uri "$orgsEndpoint/$($org.id)" -Headers $hdrs -Method Delete
            Write-Host "     [SUCCESS] Deleted '$($org.name)'" -ForegroundColor Green
        } catch {
            Write-Host "     [NOTICE] Error deleting '$($org.name)': $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Asgardeo API Notice: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Reset Local PostgreSQL Database
Write-Host "`n[2/2] Resetting Local PostgreSQL Database (invox_db)..." -ForegroundColor Yellow

$env:PGPASSWORD="1221"
try {
    psql -U postgres -h localhost -p 5432 -d invox_db -c "TRUNCATE TABLE tenant_users CASCADE; TRUNCATE TABLE tenants CASCADE;"
    Write-Host "[SUCCESS] Truncated 'tenants' and 'tenant_users' tables." -ForegroundColor Green
} catch {
    Write-Host "[NOTICE] PostgreSQL error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "   Reset Complete! Clean slate ready for testing.    " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
