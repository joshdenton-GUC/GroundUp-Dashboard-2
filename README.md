# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/1d197c9d-d28d-4ab8-8b45-e943b2e209aa

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1d197c9d-d28d-4ab8-8b45-e943b2e209aa) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables.
# Copy the example environment file and fill in your values
cp .env.example .env.local

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Setup

This project uses environment variables for configuration. You need to set up your environment variables before running the application.

### Required Environment Variables

1. **Copy the environment template:**

   ```sh
   cp .env.example .env.local
   ```

2. **Configure the following variables in `.env.local`:**

   ```env
   # Supabase Configuration (Required)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # OpenAI Configuration (Optional - for resume parsing)
   VITE_OPENAI_API_KEY=sk-your-openai-api-key

   # Resend Configuration (Optional - for email notifications)
   VITE_RESEND_API_KEY=re_your-resend-api-key
   ```

### Getting Your Keys

- **Supabase Keys**: Get these from your [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API
- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys) (needed for resume parsing feature)
- **Resend API Key**: Get from [Resend Dashboard](https://resend.com/api-keys) (needed for email notifications)

### Security Notes

- The `.env.local` file is automatically ignored by git for security
- Never commit API keys to version control
- Use the `.env.example` file as a template for team members

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## 🚀 Deployment

### Quick Start (30 Minutes)

Follow the **[QUICK_START_DEPLOYMENT.md](./QUICK_START_DEPLOYMENT.md)** guide for a streamlined deployment process.

### Comprehensive Deployment Guides

- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Complete deployment checklist with all steps
- **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** - Detailed Vercel configuration guide
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Initial Supabase and Resend setup
- **[DNS_SETUP_RESEND.md](./DNS_SETUP_RESEND.md)** - DNS configuration for email sending

### Deployment Scripts

Use these automated scripts to deploy your infrastructure:

```bash
# Deploy database migrations
./deploy-migrations.sh

# Deploy all edge functions
./deploy-functions.sh

# Configure Supabase secrets
./setup-secrets.sh
```

### Manual Deployment Steps

1. **Install Supabase CLI**
   ```bash
   # macOS
   brew install supabase/tap/supabase

   # Linux
   wget https://github.com/supabase/cli/releases/latest
   ```

2. **Link Project**
   ```bash
   supabase link --project-ref wzlqbrglftrkxrfztcqd
   ```

3. **Deploy Database**
   ```bash
   ./deploy-migrations.sh
   ```

4. **Configure Secrets**
   ```bash
   ./setup-secrets.sh
   # OR manually:
   supabase secrets set RESEND_API_KEY=re_your_key
   ```

5. **Deploy Functions**
   ```bash
   ./deploy-functions.sh
   ```

6. **Deploy to Vercel**
   - Connect GitHub repo to Vercel
   - Configure environment variables (see VERCEL_SETUP.md)
   - Deploy

### Production URLs

- **App:** https://groundupcareers.app
- **Supabase:** https://supabase.com/dashboard/project/wzlqbrglftrkxrfztcqd
- **Resend:** https://resend.com/emails

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

For Vercel deployments, see the [VERCEL_SETUP.md](./VERCEL_SETUP.md) guide.
