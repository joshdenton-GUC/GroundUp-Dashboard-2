# 🔍 Resend Email Integration Verification Checklist

**Last Updated**: 2025-11-08
**System**: GroundUp Dashboard - Alert Email System
**Status**: Ready for Production Testing

---

## 📋 Quick Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| **Resend API Integration** | ✅ Configured | 5 edge functions deployed |
| **Email Templates** | ✅ Configured | 5 alert types with templates |
| **Database Schema** | ✅ Configured | Email tracking tables ready |
| **Admin UI** | ✅ Configured | Email alerts manager component |
| **Webhook Tracking** | ✅ Configured | Real-time delivery/open tracking |
| **Fallback Mode** | ✅ Configured | Console logging if API key missing |

---

## ✅ Pre-Deployment Checklist

### 1. Environment & Secrets Setup

- [ ] **Resend API Key Added to Supabase**
  ```bash
  # Verify the secret exists
  supabase secrets list
  # Should show: RESEND_API_KEY with re_xxx... value
  ```

- [ ] **Supabase Credentials Set**
  ```bash
  # Check these secrets are set:
  supabase secrets list | grep -E "SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY"
  ```

- [ ] **Application URL Configured**
  - Verify `VITE_APP_URL` is set in Supabase edge function environment
  - Should be: `https://groundupcareers.com` (production) or `http://localhost:5173` (dev)

### 2. DNS Configuration

- [ ] **DKIM Record Added**
  - Provider: [Your DNS Provider]
  - Type: TXT
  - Name: `resend._domainkey`
  - Status: ✅ Verified at https://dnschecker.org

- [ ] **MX Record Added**
  - Type: MX
  - Name: `@`
  - Value: `feedback-smtp.resend.com`
  - Priority: `10`
  - Status: ✅ Verified at https://dnschecker.org

- [ ] **Domain Verified in Resend**
  - Log in to: https://resend.com/domains
  - Your domain: `groundupcareers.com`
  - Status: ✅ **Verified**

### 3. Edge Functions Deployment

- [ ] **send-email-alert**
  ```bash
  supabase functions deploy send-email-alert
  # Verify: No errors in deployment log
  ```

- [ ] **resend-webhook**
  ```bash
  supabase functions deploy resend-webhook
  # Verify: No errors in deployment log
  ```

- [ ] **notify-client**
  ```bash
  supabase functions deploy notify-client
  # Verify: No errors in deployment log
  ```

- [ ] **send-reminder-emails**
  ```bash
  supabase functions deploy send-reminder-emails
  # Verify: No errors in deployment log
  ```

- [ ] **resend-client-invitation**
  ```bash
  supabase functions deploy resend-client-invitation
  # Verify: No errors in deployment log
  ```

### 4. Webhook Configuration

- [ ] **Webhook URL Registered in Resend**
  - Log in to: https://resend.com/api-keys
  - Go to: Webhooks → Create
  - URL: `https://<your-supabase-url>/functions/v1/resend-webhook`
  - Events: `email.sent`, `email.delivered`, `email.opened`, `email.bounced`, `email.complained`
  - Status: ✅ Webhook created and active

### 5. Database Setup

- [ ] **Migration Applied**
  ```bash
  # Check if email tracking tables exist
  supabase db execute "SELECT * FROM email_notifications LIMIT 1;"
  # Should return results without error
  ```

- [ ] **email_alerts Table Populated**
  - At least one alert configured for testing
  - Test email: [your-test-email@example.com]

---

## 🧪 Testing All Alert Types

### Alert Type 1: New Job Posted

**Configuration:**
- Alert type: `new_job_posted`
- Recipient: [Test email address]

**Test Steps:**
1. Go to Admin Dashboard → Create New Job
2. Fill in job details
3. Process payment to mark as "Active"
4. Verify alert email received with:
   - ✅ Job title
   - ✅ Company name
   - ✅ Client contact info
   - ✅ Link to view job

**Expected**: Email within 30 seconds

---

### Alert Type 2: New Client Registered

**Configuration:**
- Alert type: `client_registered`
- Recipient: Admin email(s)

**Test Steps:**
1. Sign up as a new client at signup form
2. Complete registration
3. Wait 5 seconds
4. Verify alert email with:
   - ✅ Company name
   - ✅ Contact person name
   - ✅ Signup timestamp
   - ✅ Link to view client details

**Expected**: Email within 30 seconds

---

### Alert Type 3: Job Staged Without Payment

**Configuration:**
- Alert type: `no_sale_job_staged`
- Recipient: [Admin email(s)]

**Test Steps:**
1. Create a job but DON'T complete payment
2. Leave it as "Draft" for 1+ hours
3. System automatically checks and sends alerts
4. Verify alert email with:
   - ✅ Client name
   - ✅ Job title
   - ✅ Staging duration
   - ✅ Call-to-action to follow up

**Expected**: Email within 1 hour of staging

---

### Alert Type 4: Job Status Updated

**Configuration:**
- Alert type: `job_status_update`
- Recipient: [Admin email(s)]

**Test Steps:**
1. Go to existing job
2. Change status to:
   - [ ] "Filled" (with candidate name)
   - [ ] "Not Hired"
   - [ ] "Cancelled"
3. Verify alert email with:
   - ✅ Job title
   - ✅ New status
   - ✅ Candidate name (if applicable)
   - ✅ Timestamp

**Expected**: Email within 10 seconds of status change

---

### Alert Type 5: Resume Rejection

**Configuration:**
- Alert type: `resume_rejection`
- Recipient: [Admin email(s)]

**Test Steps:**
1. Assign a candidate to a client job
2. Client rejects the candidate
3. Verify alert email with:
   - ✅ Candidate name
   - ✅ Company name
   - ✅ Job title
   - ✅ Rejection timestamp

**Expected**: Email within 10 seconds of rejection

---

### Additional Alert Type 6: Candidate Assignment (notify-client)

**Configuration:**
- Automatic to client email(s)
- Tracked in `email_notifications` table

**Test Steps:**
1. Assign a candidate to a client job
2. Verify email to client with:
   - ✅ Candidate full name
   - ✅ Position title
   - ✅ Location
   - ✅ Skills summary
   - ✅ Education
   - ✅ Candidate profile link

**Expected**: Email within 10 seconds of assignment

**Tracking:**
- Check `email_notifications` table
- `status` should progress: `sent` → `delivered` → `opened` (when client opens)
- `resend_email_id` should match Resend dashboard

---

### Additional Alert Type 7: Reminder Emails

**Configuration:**
- Automatic for unopened initial emails after 24 hours
- Sent via `send-reminder-emails` function

**Test Steps:**
1. Assign candidate to client
2. Initial email sent and delivered
3. Wait 24 hours (or check logs)
4. Verify reminder email sent with:
   - ✅ "REMINDER:" prefix in subject
   - ✅ Same candidate info as initial
   - ✅ Tracked as `reminder` type in database

**Expected**: Email exactly 24 hours after initial email

**Note**: For testing, check Supabase logs:
```bash
supabase functions logs send-reminder-emails
```

---

## 🔍 Database Verification

### Check Email Alerts Configuration

```sql
-- List all configured alerts
SELECT alert_type, recipient_email, is_active, created_at
FROM email_alerts
ORDER BY alert_type;

-- Expected output should show at least:
-- new_job_posted | your@email.com | true | ...
-- client_registered | admin@email.com | true | ...
-- no_sale_job_staged | admin@email.com | true | ...
-- job_status_update | admin@email.com | true | ...
-- resume_rejection | admin@email.com | true | ...
```

### Check Email Notifications Tracking

```sql
-- See recent sent emails
SELECT
  id,
  candidate_id,
  client_id,
  recipient_email,
  email_type,
  status,
  sent_at,
  delivered_at,
  opened_at,
  created_at
FROM email_notifications
ORDER BY created_at DESC
LIMIT 10;

-- Expected statuses: sent, delivered, opened, failed, reminder_sent
```

### Check Email Status Flow

```sql
-- Verify complete email lifecycle
SELECT
  resend_email_id,
  recipient_email,
  status,
  sent_at,
  delivered_at,
  opened_at,
  reminder_sent_at
FROM email_notifications
WHERE recipient_email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 5;

-- Expected flow: sent → delivered → opened → reminded (if not opened in 24h)
```

---

## 🐛 Troubleshooting Guide

### Issue: Emails Not Being Sent

**Check 1: API Key is Set**
```bash
supabase secrets list | grep RESEND_API_KEY
# Should show: RESEND_API_KEY=re_xxx...
# If not, add with: supabase secrets set RESEND_API_KEY=re_xxx...
```

**Check 2: Function Logs**
```bash
supabase functions logs send-email-alert --limit 50
# Look for errors like:
# - "RESEND_API_KEY not found"
# - "Failed to send email"
# - Network errors
```

**Check 3: Domain Verification**
- Go to https://resend.com/domains
- Is your domain showing as ✅ **Verified**?
- If not, wait 5-10 minutes and try again

**Check 4: Alert Configuration**
```sql
SELECT * FROM email_alerts WHERE is_active = true;
-- Should show configured recipients
-- If empty, add alerts via Admin UI: Settings → Email Alerts
```

---

### Issue: Emails Marked as "Failed" in Database

**Check 1: Webhook is Receiving Events**
- Go to Resend Dashboard → Webhooks
- Click your webhook
- Check "Deliveries" tab
- Should show successful deliveries from your app

**Check 2: DNS Records**
- Visit https://dnschecker.org
- Search for `resend._domainkey.groundupcareers.com`
- Should show your DKIM value
- If not, wait 1-24 hours for propagation

**Check 3: Email Content**
- Check email_notifications.subject field
- Verify template didn't have rendering errors
- Check email_notifications.body field (if stored)

---

### Issue: "Already Confirmed" on Resend Invitation

**This is Expected**: Shows that user already set their password
**Solution**: Only pending users will receive new invitations

---

### Issue: Webhook Events Not Updating Email Status

**Check 1: Webhook URL Correct**
```bash
# Verify function is running
supabase functions logs resend-webhook --limit 20
```

**Check 2: Webhook Secret Configured**
- Resend Dashboard → Webhooks → Your webhook
- Click "Show Secret"
- Should match any validation in your code

**Check 3: Email Tracked in Database**
```sql
-- Check if resend_email_id is being stored
SELECT resend_email_id, status FROM email_notifications LIMIT 5;
-- resend_email_id should be like: 00000000-0000-0000-0000-000000000000
```

---

## 📊 Monitoring & Analytics

### Real-Time Email Monitoring

**In Resend Dashboard:**
1. Go to https://resend.com
2. Click "Emails" tab
3. See all sent emails with status
4. Click email to see delivery details

**In Your App:**
1. Admin Dashboard → Email Analytics (if available)
2. Filter by:
   - Alert type
   - Date range
   - Status (sent/delivered/opened/failed)
3. See open rates, delivery rates, etc.

### Email Performance Metrics to Track

| Metric | Target | How to Check |
|--------|--------|--------------|
| **Delivery Rate** | > 98% | Database: `email_notifications` status = 'delivered' |
| **Open Rate** | > 30% | Database: Count `status = 'opened'` / total sent |
| **Send Latency** | < 5 seconds | Compare `created_at` vs `sent_at` timestamps |
| **Bounce Rate** | < 2% | Database: Count `status = 'failed'` bounces |
| **Reminder Accuracy** | 100% | Verify reminders sent 24h after initial |

---

## 🔐 Security Checklist

- [ ] **API Key Protected**
  - ✅ Only stored in Supabase secrets (not in .env)
  - ✅ Not exposed in frontend code
  - ✅ Starts with `re_` (Resend format)

- [ ] **Webhook Secured**
  - ✅ Only accepts POST requests
  - ✅ Validates Resend signature (if implemented)
  - ✅ No sensitive data in URL

- [ ] **Email Content Safe**
  - ✅ No hardcoded passwords
  - ✅ No API keys in emails
  - ✅ Proper HTML escaping in templates

- [ ] **Access Control**
  - ✅ Email alerts editor restricted to admins
  - ✅ Email history visible only to authorized users
  - ✅ Delete sensitive emails from database

---

## 📝 Configuration Summary

**Email Alerts Manager Location:**
- Component: `/src/components/admin/EmailAlertsManager.tsx`
- Access: Admin Dashboard → Settings → Email Alerts
- Functionality: Add/remove/toggle email alerts

**Key Files to Review:**
```
src/lib/emailService.ts                    # Email service class
src/lib/emailAlertTriggers.ts              # Alert trigger functions
src/components/admin/EmailAlertsManager.tsx # Admin UI
supabase/functions/send-email-alert/       # Main alert dispatcher
supabase/functions/resend-webhook/         # Webhook processor
supabase/functions/notify-client/          # Candidate notifications
supabase/functions/send-reminder-emails/   # Reminder logic
supabase/functions/resend-client-invitation/ # Resend invitations
```

---

## 🚀 Deployment Checklist

**Before Going Live:**

- [ ] All 5 edge functions deployed successfully
- [ ] At least 1 alert configured for each type
- [ ] DNS records verified (DKIM + MX)
- [ ] Webhook endpoint working
- [ ] Test emails sent and received
- [ ] Resend dashboard shows emails as "Delivered"
- [ ] Database tracking emails properly
- [ ] Team notified of new system
- [ ] Admin trained on Email Alerts Manager
- [ ] Support team has troubleshooting guide

**Go-Live Steps:**
1. Deploy all functions: `./deploy-functions.sh` (or individual deploys)
2. Configure email alerts for your team
3. Send test emails to verify
4. Enable monitoring and alerts
5. Document SLAs (e.g., "Alerts sent within 30 seconds")

---

## 📞 Support & Escalation

**For Email Delivery Issues:**
1. Check function logs: `supabase functions logs send-email-alert`
2. Verify Resend dashboard: https://resend.com
3. Check DNS: https://dnschecker.org
4. Review troubleshooting section above

**Escalation Contacts:**
- **Resend Support**: support@resend.com
- **Supabase Support**: https://supabase.com/support
- **Internal Team**: [Your team contact]

---

## ✨ What's Next?

**Phase 1 (Current):**
- ✅ Email system deployed
- ✅ Alert types configured
- ✅ Database schema ready
- ✅ Verification checklist created

**Phase 2 (Upcoming):**
- [ ] Team training on Email Alerts Manager
- [ ] Configure production email alerts
- [ ] Set up monitoring dashboard
- [ ] Establish SLAs and response times

**Phase 3 (Future Enhancements):**
- [ ] SMS alerts (optional)
- [ ] Slack notifications (optional)
- [ ] Email templates customization UI
- [ ] A/B testing for email subject lines
- [ ] Advanced analytics dashboard

---

**Document Version**: 1.0
**Last Verified**: 2025-11-08
**Next Review**: 2025-12-08
