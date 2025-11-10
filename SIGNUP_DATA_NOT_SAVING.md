# Sign-Up Data Not Saving to Supabase Tables

## What You're Experiencing

You mentioned that when users sign up with their information (company name, phone number, address), it's saved in "profile" but the data is missing in Supabase tables.

## Understanding the Data Flow

### How Sign-Up Data is Stored

When a user signs up, the data goes through this flow:

```
1. User fills sign-up form
   ↓
2. Data sent to Supabase auth.signUp() as "user metadata"
   ↓
3. Supabase creates user in auth.users table
   ↓
4. handle_new_user trigger fires
   ↓
5. Trigger creates:
   - Profile record in profiles table
   - Client record in clients table (with company info)
```

### Where Data is Stored

The sign-up data is stored in **three different places**:

1. **auth.users.raw_user_meta_data** (Supabase internal table)
   - Stores: company_name, contact_phone, street1, street2, city, state, zip
   - This is the "profile" you're seeing
   - Not directly accessible via normal queries

2. **profiles table** (your application table)
   - Stores: user_id, email, full_name (auto-generated as "User_XX"), role
   - Does NOT store company info or address

3. **clients table** (your application table)
   - Stores: user_id, company_name, contact_phone, street1, street2, city, state, zip
   - This is where the sign-up data SHOULD appear

## Is This a Problem?

**It depends on where you're looking:**

### ✅ Normal (Expected Behavior):
- User metadata (company name, phone, address) is in `auth.users.raw_user_meta_data`
- Company info and address are in `clients` table
- `profiles` table only has user ID, email, and role

### ❌ Problem (Data Not Saving):
- `clients` table is empty or missing data
- Company name and contact info not showing in `clients` table
- Address fields (street1, city, state, etc.) not in `clients` table

## How to Verify If Data is Saving Correctly

### Step 1: Check the auth.users Table

1. Go to Supabase Dashboard
2. Click **Table Editor** → **Auth** → **Users**
3. Find the user by email
4. Click on the row to expand
5. Look at `raw_user_meta_data` column - you should see:
   ```json
   {
     "company_name": "Company Name Here",
     "contact_phone": "+1234567890",
     "street1": "123 Main St",
     "city": "City",
     "state": "State",
     "zip": "12345"
   }
   ```

### Step 2: Check the profiles Table

1. Go to Supabase Dashboard
2. Click **Table Editor** → **public** → **profiles**
3. Find the user by email
4. You should see:
   - `user_id`: UUID
   - `email`: user's email
   - `full_name`: "User_01", "User_02", etc. (auto-generated)
   - `role`: "client"

**Note:** The profiles table does NOT store company info or address - this is normal.

### Step 3: Check the clients Table (MOST IMPORTANT)

1. Go to Supabase Dashboard
2. Click **Table Editor** → **public** → **clients**
3. Find the client by matching the `user_id` with the profile
4. You should see:
   - `user_id`: Same UUID as in profiles
   - `company_name`: "Company Name Here"
   - `contact_phone`: "+1234567890"
   - `street1`: "123 Main St"
   - `street2`: "Suite 100" (if provided)
   - `city`: "City"
   - `state`: "State"
   - `zip`: "12345"

**If data is NOT in the clients table, there's a problem.**

## Common Issues and Fixes

### Issue 1: Clients Table is Empty

**Cause:** The `handle_new_user` trigger might not be running or failing silently.

**Fix:**

1. Check trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Check trigger function:
   ```sql
   SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';
   ```

3. If trigger is missing, run this migration:
   `/supabase/migrations/20251009100001_update_handle_new_user_for_address_fields.sql`

### Issue 2: Company Name is Required But Not Provided

**Cause:** The trigger only creates a client record if `company_name` is provided.

**Check:** In the sign-up form, "Company Name" has an asterisk (*) indicating it's required.

**Fix:** Ensure users are filling in the Company Name field. The form validation should prevent submission without it.

### Issue 3: Email Confirmation is Pending

**Important:** In Supabase, the trigger fires **immediately** when the user signs up, BEFORE email confirmation.

**However**, if there's an error during user creation or the transaction is rolled back, the trigger won't complete.

**Check:**
1. Go to **Authentication** → **Users**
2. Find the user
3. Check if `email_confirmed_at` is null
4. Even if email is not confirmed, the profile and client records should still exist

### Issue 4: Row Level Security (RLS) Preventing Inserts

**Cause:** RLS policies might be preventing the trigger from creating client records.

**Fix:** The trigger uses `SECURITY DEFINER` which should bypass RLS, but check:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'clients';

-- Check INSERT policies
SELECT * FROM pg_policies WHERE tablename = 'clients' AND cmd = 'INSERT';
```

If there are no INSERT policies or they're too restrictive, add:

```sql
-- Allow the trigger to insert
CREATE POLICY "Allow trigger inserts" ON public.clients
  FOR INSERT
  WITH CHECK (true);
```

### Issue 5: Trigger Function is Outdated

**Cause:** An older version of the trigger might be using the old `address` field instead of separate address fields.

**Fix:** Ensure the latest trigger is deployed:

```bash
# Check which migrations have been run
supabase db remote commit

# If migration 20251009100001 is not listed, run it:
supabase db push
```

## Testing the Fix

After applying any fixes, test with a new sign-up:

1. Sign up a new user with all fields filled:
   - Email: test@example.com
   - Password: TestPassword123!
   - Company Name: Test Company
   - Contact Phone: +1234567890
   - Street Address 1: 123 Main St
   - City: Testville
   - State: TS
   - Zip: 12345

2. Check Supabase Dashboard:
   - **auth.users**: Should have user with raw_user_meta_data
   - **profiles**: Should have profile with role "client"
   - **clients**: Should have client with all company and address info

3. Check application UI:
   - User should see their company name in the profile
   - Company profile page should show all saved data

## SQL Query to Check Data

Run this query in Supabase SQL Editor to see all user data together:

```sql
SELECT
  u.email,
  u.raw_user_meta_data,
  p.full_name,
  p.role,
  c.company_name,
  c.contact_phone,
  c.street1,
  c.street2,
  c.city,
  c.state,
  c.zip,
  c.created_at as client_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.clients c ON c.user_id = u.id
WHERE u.email = 'user@example.com'; -- Replace with actual email
```

This will show you:
- If the user exists
- If the profile was created
- If the client record was created
- What data is stored where

## Is It a Problem?

**Short Answer:** If the data appears in the clients table, everything is working correctly.

**If data is ONLY in raw_user_meta_data but NOT in clients table:**
- ✅ Not a problem if users can still use the app normally
- ❌ **Problem** if you need to query client data (for admin dashboards, reports, etc.)

**Why it matters:**
- `raw_user_meta_data` is not easily queryable
- You can't filter, sort, or join on metadata
- The `clients` table is designed for efficient queries

## Next Steps

1. **Verify** where the data actually is using the SQL query above
2. **Check** if clients table has the data
3. **If missing**, check Supabase logs for errors:
   - Go to **Logs** → **Postgres Logs**
   - Filter for errors around user sign-up time
4. **Apply fixes** based on which issue you're experiencing
5. **Test** with a new sign-up to confirm it's working

## Related Files

- Sign-up form: `src/pages/auth/AuthPage.tsx`
- Auth context: `src/contexts/AuthContext.tsx`
- Trigger migration: `supabase/migrations/20251009100001_update_handle_new_user_for_address_fields.sql`
- Clients table creation: `supabase/migrations/20250918033428_b0ecb181-7b2a-4ce1-ae40-e5973d57593e.sql`
- Address fields migration: `supabase/migrations/20251009100000_add_address_fields_to_clients.sql`

## Summary

The data flow is:
1. User signs up → data stored in `raw_user_meta_data`
2. Trigger creates profile in `profiles` table
3. Trigger creates client in `clients` table with company info

If data is not in the `clients` table, follow the troubleshooting steps above to identify and fix the issue.
