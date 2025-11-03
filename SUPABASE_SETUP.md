# Supabase Setup Instructions

This app is ready to connect to Supabase with Google OAuth and Razorpay payment integration. Follow these steps:

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in your project details and create it

## 2. Import the Database Schema

1. In your Supabase project, go to the SQL Editor
2. Copy the entire contents of `database-schema.sql` from this repository
3. Paste it into the SQL Editor and click "Run"
4. This will create all tables, functions, RLS policies, and sample data

## 3. Get Your Project Credentials

1. Go to Project Settings → API
2. Copy your:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## 4. Configure Environment Variables

Create a `.env` file in the root of your project (copy from `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 5. Configure Authentication

### Email/Password Authentication
1. In Supabase Dashboard, go to Authentication → URL Configuration
2. Add your site URL (e.g., `http://localhost:8080` for local development)
3. Add redirect URLs:
   - `http://localhost:8080/**` for local
   - Your production URL when deployed

### Google OAuth Setup
1. Go to Authentication → Providers
2. Enable Google provider
3. Create a Google Cloud Project at https://console.cloud.google.com
4. Set up OAuth consent screen
5. Create OAuth 2.0 credentials (Web application)
6. Add authorized JavaScript origins: `http://localhost:8080` (for local)
7. Add authorized redirect URIs: Your Supabase project's callback URL (shown in Supabase)
8. Copy Client ID and Client Secret to Supabase Google provider settings
9. Store these credentials in the admin panel's API Keys section

## 6. Configure Razorpay Payment Gateway

1. Create a Razorpay account at https://razorpay.com
2. Get your API Key ID and Secret from Dashboard
3. Log in to your app as admin
4. Go to Admin Panel → Settings → API Keys
5. Add Razorpay Key ID and Secret Key
6. These will be securely stored in Supabase

## 7. Optional: Disable Email Confirmation (for testing)

1. Go to Authentication → Settings
2. Disable "Enable email confirmations"
3. This speeds up testing during development

## 8. Create an Admin User

After your first user signs up, you need to grant them admin role:

```sql
-- Run this in your Supabase SQL Editor
-- Replace 'user-id-here' with the actual user ID from auth.users table

INSERT INTO user_roles (user_id, role)
VALUES ('user-id-here', 'admin');
```

## 9. Restart Your Development Server

```bash
npm run dev
```

Your app should now be connected to Supabase!

## Features Enabled by Supabase

- ✅ User Authentication (Email/Password & Google OAuth)
- ✅ User Profiles with RLS security
- ✅ Secure Admin Role Management
- ✅ Cart Management (synced across devices)
- ✅ Product Management
- ✅ Order Processing with Razorpay payments
- ✅ Contact Form Management
- ✅ API Keys Storage (secure)
- ✅ Site Settings Management
- ✅ And more...

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env` file has the correct URL and anon key
- Make sure the `.env` file is in the project root
- Restart your dev server after adding `.env`

### Authentication redirects to wrong URL
- Check Authentication → URL Configuration in Supabase
- Make sure your site URL and redirect URLs are correct

### RLS Policy errors
- Make sure you imported the entire `database-schema.sql`
- Check that RLS policies are enabled on tables
- Verify the `has_role` function was created

### Google OAuth not working
- Check that you've enabled Google provider in Supabase Auth
- Verify redirect URLs are correctly configured in Google Cloud Console
- Make sure your site URL is added in Supabase Auth settings
- Ensure Client ID and Secret are correctly entered in Supabase

### Razorpay payments failing
- Verify API keys are correctly saved in admin panel
- Check that Razorpay script is loaded (check browser console)
- Ensure you're using test keys for development
- Verify webhook URLs are configured in Razorpay dashboard

## Security Notes

- Never commit your `.env` file (it's already in `.gitignore`)
- The anon key is safe to use in client-side code
- RLS policies protect your data even with the anon key exposed
- Admin role is secured via the `user_roles` table and `has_role()` function
