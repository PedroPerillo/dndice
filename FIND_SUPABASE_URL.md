# How to Find Your Supabase Project URL

## If You Haven't Created a Supabase Project Yet:

1. **Go to Supabase**: https://supabase.com
2. **Sign up/Login** if you haven't already
3. **Create a New Project**:
   - Click "New Project" or "+ New Project"
   - Choose an organization
   - Enter project details:
     - **Name**: DnDice (or any name)
     - **Database Password**: Create a strong password (save this!)
     - **Region**: Choose closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for project to initialize

## Once Your Project is Created:

1. **Go to your project dashboard**
2. **Click "Settings"** (gear icon in left sidebar)
3. **Click "API"** (under Project Settings)
4. **Find "Project URL"** section
   - It should look like: `https://xxxxx.supabase.co`
   - This is your `VITE_SUPABASE_URL`

## If You Can't See the URL:

- Make sure you're in the correct project (check top left for project name)
- Make sure the project has finished initializing (wait a few minutes)
- Try refreshing the page
- Check if you're in the right organization

## Alternative: Check Project Settings

1. Click on your project name (top left)
2. Go to **Settings → General**
3. Look for "Reference ID" or "Project URL"
4. Or go to **Settings → API** directly

The URL format is always: `https://[your-project-ref].supabase.co`

