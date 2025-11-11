# Profile Sign-Up Fix

## Issue Description

Profiles were not being saved during sign-up, preventing users from:
- Completing registration
- Saving jobs
- Processing payments through Stripe

## Root Cause

**Migration Conflict**: Multiple migrations were modifying the `handle_new_user()` database trigger function, causing conflicts:

1. **Migration 20250120000021** (Jan 2025) - ✅ Created client records on signup
2. **Migration 20250918033347** (Sept 2025) - ❌ **OVERWROTE** the function, breaking client creation
3. **Migration 20251009100001** (Oct 2025) - ✅ Fixed address fields but conflict remained

The September migration was resetting the function to only create profiles with role='user', not creating client records, and not extracting metadata properly.

## The Fix

Created a new migration: `20251108000000_fix_profile_client_creation.sql`

This migration:
- Drops and recreates the `handle_new_user()` function with correct implementation
- Ensures both profile AND client records are created on signup
- Properly extracts company metadata (name, phone, address fields)
- Sets the correct role ('client') for new signups
- Generates sequential user IDs (User_01, User_02, etc.)
- Prevents duplicate client records with `ON CONFLICT DO NOTHING`

## What the Fixed Trigger Does

When a new user signs up:

1. **Creates Profile Record**
   - Generates user_id in format "User_XX"
   - Sets email from auth.users
   - Sets role to 'client'

2. **Extracts Metadata**
   - company_name
   - contact_phone
   - street1, street2
   - city, state, zip

3. **Creates Client Record**
   - Only if company_name is provided
   - Links to user via user_id
   - Stores all contact and address information

## How to Apply the Fix

### Option 1: Using the Deployment Script (Recommended)

```bash
./deploy-migrations.sh
```

This will:
- Check for Supabase CLI
- Link to your project
- Apply all pending migrations including the fix

### Option 2: Manual Deployment

```bash
# Link to your Supabase project
supabase link --project-ref wzlqbrglftrkxrfztcqd

# Push migrations to remote database
supabase db push
```

### Option 3: Direct SQL (Emergency Fix)

If you need to apply just this fix immediately:

```bash
# Copy the SQL from the migration file and run it in Supabase SQL Editor
cat supabase/migrations/20251108000000_fix_profile_client_creation.sql
```

Then paste into: https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd/sql

## Verification Steps

After applying the migration:

### 1. Check the Trigger Function

Run this SQL in Supabase SQL Editor:

```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';
```

You should see the function creating both profiles AND clients tables.

### 2. Test Sign-Up Flow

1. Create a new test user account
2. Check the `profiles` table - should have a new record
3. Check the `clients` table - should have a new record with the same user_id
4. Verify the user can access the application

### 3. Check Existing Users

For users who signed up during the bug period:

```sql
-- Find users with profiles but no client records
SELECT p.user_id, p.email, p.full_name
FROM profiles p
LEFT JOIN clients c ON c.user_id = p.user_id
WHERE c.id IS NULL
AND p.role = 'client';
```

If you find any, you may need to manually create client records for them.

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Test user signup creates profile record
- [ ] Test user signup creates client record
- [ ] User can log in after verification
- [ ] User can access dashboard
- [ ] User can create job posts
- [ ] User can process Stripe payments

## Files Changed

- `supabase/migrations/20251108000000_fix_profile_client_creation.sql` - New migration fixing the trigger

## Related Files (Reference)

- `src/contexts/AuthContext.tsx` - Sign-up logic, sends metadata
- `src/pages/auth/AuthPage.tsx` - Sign-up form UI
- `src/pages/auth/AuthCallbackPage.tsx` - Email verification handler
- `supabase/migrations/20251009100001_update_handle_new_user_for_address_fields.sql` - Previous version

## Impact

- **Critical**: Fixes sign-up flow for all new users
- **Scope**: Affects all user registrations
- **Breaking**: No - only fixes existing functionality
- **Rollback**: Can drop and recreate trigger with previous version if needed

## Support

If the migration fails:
1. Check Supabase CLI is installed: `supabase --version`
2. Verify project link: `supabase projects list`
3. Check database connection: `supabase db remote show`
4. View migration status: `supabase migration list`
5. Review logs in Supabase Dashboard

## Next Steps After Deployment

1. Monitor sign-up flow for 24-48 hours
2. Check for any error logs in Supabase Dashboard
3. Verify no duplicate client records are being created
4. Test Stripe integration with newly signed-up users
