# Quick Vercel Setup Guide

## Step 1: Fix the App (Make it work without Supabase first)

The app should now work even without Supabase configured. Try refreshing your browser - you should see the dice roller interface.

## Step 2: Set Up Supabase (Optional but Recommended)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Get your credentials from **Settings → API**:
   - Project URL
   - Anon/public key
4. Run the SQL from `supabase-schema.sql` in the **SQL Editor**

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Website (Easiest)

1. **Push to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click **"Add New Project"**
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Add Environment Variables**:
   - In the project settings, go to **Environment Variables**
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Click **Save**

4. **Deploy**:
   - Click **Deploy**
   - Wait for deployment to complete
   - Your app will be live at `your-project.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked about environment variables, add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **For Production**:
   ```bash
   vercel --prod
   ```

## Step 4: Update Environment Variables After Deployment

If you need to add/update environment variables after deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add or update variables
4. Go to **Deployments** tab
5. Click the three dots on the latest deployment
6. Click **Redeploy**

## Troubleshooting

### App shows blank screen
- Check browser console for errors
- Make sure you've run `npm install`
- Try `npm run dev` to see if it works locally

### Environment variables not working
- Make sure variable names start with `VITE_`
- Redeploy after adding variables
- Check Vercel deployment logs

### Supabase errors
- Verify your credentials are correct
- Check that you've run the SQL schema
- Make sure RLS policies are set up

## Your App Will Be Live At:
After deployment, Vercel will give you a URL like:
- `https://your-project-name.vercel.app`

You can also add a custom domain in Vercel project settings!

