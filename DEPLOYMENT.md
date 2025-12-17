# Deployment Guide

## Step 1: Set Up Supabase

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project (choose a name and database password)

2. **Get Your Credentials**
   - In your Supabase project, go to **Settings** → **API**
   - Copy your **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy your **anon/public key** (long string starting with `eyJ...`)

3. **Set Up Database**
   - Go to **SQL Editor** in your Supabase dashboard
   - Click **New Query**
   - Copy and paste the contents of `supabase-schema.sql`
   - Click **Run** to execute the SQL
   - This creates the `quick_rolls` table with proper security policies

## Step 2: Configure Environment Variables

### For Local Development:

1. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Restart your dev server:
```bash
npm run dev
```

### For Vercel Deployment:

1. **Option A: Via Vercel Dashboard**
   - After deploying, go to your project settings
   - Navigate to **Environment Variables**
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Redeploy your project

2. **Option B: Via Vercel CLI**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

## Step 3: Deploy to Vercel

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click **Add New Project**
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings
   - Add environment variables (see Step 2)
   - Click **Deploy**

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Add environment variables when asked

4. **For Production**
   ```bash
   vercel --prod
   ```

## Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Click the auth button in the top left
3. Sign up with a test email
4. Create a quick roll
5. Sign out and sign back in - your quick roll should persist!

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure your `.env` file exists and has the correct variable names
- Restart your dev server after creating/modifying `.env`
- For Vercel, ensure environment variables are set in project settings

### "Error loading quick rolls"
- Check that you've run the SQL schema in Supabase
- Verify your Supabase credentials are correct
- Check browser console for detailed error messages

### Authentication not working
- Ensure email confirmation is disabled in Supabase (Settings → Authentication → Email)
- Or check your email for the confirmation link
- Verify your Supabase project is active

### Quick rolls not saving
- Check browser console for errors
- Verify Row Level Security policies are set up correctly
- Ensure you're logged in (check top left corner)

## Security Notes

- The `anon` key is safe to use in frontend code (it's public)
- Row Level Security (RLS) ensures users can only access their own data
- Never commit your `.env` file to git (it's already in `.gitignore`)

