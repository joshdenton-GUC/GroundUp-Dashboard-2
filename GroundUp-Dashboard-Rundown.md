# GroundUp Dashboard - Platform Overview

## Executive Summary

GroundUp Dashboard is a **B2B recruitment SaaS platform** designed to streamline the hiring process for companies while providing administrative oversight and management. The platform features a dual-role architecture serving both **Administrators** (your team) and **Clients** (businesses hiring talent).

---

## Technology Stack

- **Frontend**: React with TypeScript, modern UI framework (shadcn/ui)
- **Backend**: Supabase (PostgreSQL database + serverless functions)
- **Payments**: Stripe integration for secure payment processing
- **AI**: Google Gemini for intelligent resume parsing
- **Email**: Resend for transactional emails and notifications
- **Hosting**: Vercel with automatic deployments

---

## ADMIN FEATURES

### 1. Admin Dashboard Overview
A comprehensive control center with seven main sections:

#### 📊 Analytics & Overview
- **Key Metrics**: Total candidates, active clients, monthly growth tracking
- **Activity Feed**: Real-time view of user registrations, job postings, and payments
- **Performance Analytics**: Job posting trends, candidate pipeline metrics

#### 👥 Client Management
- View all registered companies and their details
- **Account Control**: Activate/deactivate client accounts
- **Status Tracking**: Monitor welcome email delivery and account confirmation
- **Invitation System**: Resend invitations to unconfirmed clients
- Search and filter by client status

#### 📝 Candidate Management
- **Centralized Database**: View all candidates across all clients
- **Advanced Search**: Filter by name, email, skills, or status
- **Status Tracking**: Monitor candidates through hiring pipeline:
  - Pending Review
  - Reviewing
  - Interviewing
  - Interviewed
  - Hired / Not Hired
  - Rejected / Withdrawn
- **Resume Access**: View and download candidate resumes directly
- **Real-time Updates**: Live data synchronization

#### 📤 Bulk Resume Upload
- **AI-Powered Parsing**: Upload resumes in PDF, DOCX, or TXT format
- **Automatic Extraction**: Gemini AI extracts:
  - Name, email, phone
  - Skills and experience
  - Education and location
  - Professional summary
- **Batch Processing**: Upload multiple resumes at once
- **Storage**: Secure resume file storage with access controls

#### ➕ Client Invitation System
- **Onboard New Clients**: Invite companies to join the platform
- **Automated Emails**: System sends invitation and welcome emails
- **Profile Setup**: Collect company information:
  - Company name, contact details
  - Full address (street, city, state, zip)
  - Email and phone

#### 📧 Email Alert Configuration
- **Customizable Notifications**: Configure who receives alerts for:
  - New job postings
  - Job status changes
  - New client registrations
  - Payment failures ("no sale" alerts)
- **Multiple Recipients**: Add multiple email addresses per alert type
- **Enable/Disable**: Toggle alerts on or off as needed

#### 🔒 Security Audit Log
- **Compliance Tracking**: Complete audit trail of all admin actions
- **Detailed Records**: User, timestamp, IP address, action type
- **Resource Tracking**: What was changed and when
- **Filtering**: Search by action type and resource

---

## CLIENT FEATURES

### 2. Client Dashboard
A streamlined interface for companies to post jobs and manage candidates:

#### 💼 Post New Job
- **Company Profile Integration**: Pre-fill company information
  - Company name, address, phone, email, website
  - Company description
  - Template saved for future posts

- **Job Details Form**:
  - Job title and type (Full-time, Part-time, Contract, Temporary)
  - **Two-Tier Pricing**:
    - **STANDARD**: $500
    - **PREMIUM**: $1,500
  - Location and salary range
  - Job description, requirements, benefits
  - Form validation with error checking

- **Save as Draft**: Work on jobs before posting
- **Payment Integration**: Secure Stripe checkout when ready to post

#### 📋 Manage Jobs
- **Job List View**: All posted jobs in one place
- **Search & Filter**: Find jobs by title or status
- **Status Management**:
  - Pause active jobs
  - Resume paused jobs
  - Mark as filled
  - Cancel postings
- **Job Details**: View full posting information
- **PDF Export**: Download job posting as PDF
- **Expiration Tracking**: 30-day automatic expiration

#### 🎯 Review Candidates
- **Sequential Review Workflow**: Review candidates one at a time
- **Complete Candidate Profiles**:
  - Resume and contact information
  - Skills and experience summary
  - Education background
- **Quick Actions**:
  - **Accept**: Move to hired status
  - **Reject**: Mark as not hired with notes
  - **Interview**: Schedule or mark for interview
- **Next/Previous Navigation**: Move through pending candidates easily

#### 📊 Job Staging
- **Pre-Payment Preview**: Review complete job posting before payment
- **Payment Confirmation**: See pricing and terms before committing
- **"Ready to Post" Button**: Initiate secure Stripe payment

#### ✅ Hired Talent
- **View All Hires**: See everyone you've hired through the platform
- **Hire Dates**: Track when each candidate was hired
- **Candidate Information**: Access full candidate profiles
- **Search & Filter**: Find specific hires quickly

#### 👤 Manage Candidates
- **Detailed Candidate Management**: View all candidates assigned to your company
- **Edit Information**: Update candidate details
- **Upload Resumes**: Add or replace candidate documents
- **Communication History**: Track interactions with candidates

#### 🏢 Company Profile
- **Edit Company Information**: Update details anytime
- **Address Management**: Full address fields
- **Contact Information**: Keep phone and email current
- **Company Description**: Update company overview

#### ❓ How To / Help Center
- **Feature Guides**: Step-by-step instructions
- **FAQ Section**: Common questions answered
- **Support Documentation**: Comprehensive help resources

---

## PAYMENT PROCESSING

### Secure Stripe Integration
- **Two-Tier Pricing Model**:
  - STANDARD Job Posts: $500
  - PREMIUM Job Posts: $1,500

- **Payment Flow**:
  1. Client completes job posting form
  2. Saves as draft (free)
  3. When ready, initiates payment
  4. Secure Stripe payment form
  5. Payment processed
  6. Job automatically posted live
  7. Invoice emailed to client
  8. Admin receives "new job" alert

- **Payment Features**:
  - PCI-compliant security
  - Multiple payment methods (cards, digital wallets)
  - Automatic invoice generation
  - Failed payment handling
  - Transaction audit trail
  - Payment status tracking

---

## EMAIL NOTIFICATION SYSTEM

### Automated Email Alerts
- **Client Emails**:
  - Welcome email upon registration
  - Payment invoices/receipts
  - Job posting confirmations
  - Candidate status updates

- **Admin Alerts** (Configurable):
  - New job posted notification
  - Job status change alerts
  - New client registration
  - Payment failures ("no sale")

- **Email Provider**: Resend (reliable transactional email service)
- **Customizable Recipients**: Configure who receives each alert type

---

## SECURITY & COMPLIANCE

### Data Security
- **Role-Based Access Control**: Strict separation of admin and client data
- **Row-Level Security**: Clients can only see their own data
- **Encrypted Storage**: Sensitive data encrypted at rest
- **Audit Logging**: Complete trail of all admin actions
- **Secure Authentication**: Email/password with optional OAuth (Google, Apple)

### Payment Security
- **PCI Compliance**: Stripe handles all payment data
- **No Card Storage**: No raw card data stored in database
- **Webhook Verification**: Signature verification on all payment events
- **Transaction Logging**: Complete payment audit trail

### Privacy
- **Data Isolation**: Multi-tenant architecture with complete data separation
- **User Consent**: Terms of service and privacy policy acceptance
- **Email Preferences**: Configurable notification settings

---

## KEY DIFFERENTIATORS

### 1. AI-Powered Resume Intelligence
- Automatic parsing of uploaded resumes using Google Gemini AI
- Extracts structured candidate data
- Supports PDF, DOCX, and TXT formats
- Reduces manual data entry by 90%

### 2. Two-Tier Job Pricing
- Flexible pricing model: Standard ($500) and Premium ($1,500)
- Allows businesses to choose level of visibility
- Revenue optimization for different job types

### 3. Sequential Candidate Review
- Focused, one-at-a-time candidate review workflow
- Reduces decision fatigue
- Ensures thorough evaluation of each candidate

### 4. Complete Payment Integration
- Stripe payment processing built directly into workflow
- No manual invoicing or payment tracking needed
- Automatic job posting upon payment confirmation

### 5. Real-Time Updates
- Live candidate counts and status updates
- Real-time data synchronization across dashboard
- Instant notifications via email

### 6. Comprehensive Admin Oversight
- Full visibility into all client activities
- Security audit logging for compliance
- Configurable email alert system
- Client account management controls

---

## DATA FLOW OVERVIEW

### Job Posting Workflow
```
Client creates job → Saves as draft → Reviews in staging →
Initiates payment → Stripe processes → Payment succeeds →
Job posted live → Invoice sent → Admin notified →
Job expires after 30 days (or marked filled)
```

### Candidate Management Workflow
```
Admin uploads resume → AI parses information →
Candidate profile created → Assigned to client →
Client reviews candidate → Accept/Reject/Interview →
Status updated → Notifications sent →
Hired candidates tracked in "Hired Talent"
```

### Client Onboarding Workflow
```
Admin invites client → Invitation email sent →
Client registers → Company profile created →
Welcome email sent → Account activated →
Client posts first job
```

---

## PLATFORM METRICS & ANALYTICS

### Admin Dashboards Track:
- Total candidates in system
- Active client count
- Monthly growth rates
- Payment transactions
- Job posting activity
- Candidate status distribution
- User registration trends

### Client Dashboards Show:
- Number of active job posts
- Pending candidate reviews (with badge count)
- Total hired talent
- Job posting history
- Payment history

---

## INTEGRATION CAPABILITIES

### Current Integrations:
- **Supabase**: Database, authentication, file storage, serverless functions
- **Stripe**: Payment processing and invoicing
- **Resend**: Transactional email delivery
- **Google Gemini**: AI-powered resume parsing
- **Vercel**: Hosting and deployment

### Email Service Features:
- Bounce and complaint handling
- Delivery status tracking
- Unsubscribe management
- DKIM/SPF/DMARC for deliverability

---

## MOBILE & RESPONSIVE DESIGN
- Fully responsive interface
- Works on desktop, tablet, and mobile
- Touch-friendly navigation
- Optimized forms for mobile input

---

## BROWSER SUPPORT
- Chrome, Firefox, Safari, Edge (latest versions)
- Dark mode and light mode support
- Accessibility features for screen readers

---

## SUMMARY

The GroundUp Dashboard is a **production-ready, enterprise-grade recruitment platform** designed for scalability and ease of use. It provides:

**For Administrators**:
- Complete oversight of all clients and candidates
- AI-powered resume processing
- Configurable email notification system
- Security and compliance features
- Analytics and reporting

**For Clients**:
- Simple job posting with secure payment
- Focused candidate review workflow
- Complete hiring pipeline management
- Automated notifications
- Company profile management

**Business Value**:
- Reduces time-to-hire by streamlining candidate review
- Automates manual processes (resume parsing, payments, notifications)
- Provides complete audit trail for compliance
- Scalable multi-tenant architecture
- Revenue-generating two-tier pricing model

---

*Document Generated: 2025-11-11*
*GroundUp Dashboard Platform Documentation*
