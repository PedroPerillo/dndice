# Quick Deploy to Vercel

## ✅ Your app is ready to deploy!

The app now works without Supabase (auth will be disabled until you configure it).

## 🚀 Deploy in 3 Steps:

### Step 1: Push to GitHub (if you haven't already)

```bash
git init
git add .
git commit -m "Ready for Vercel deployment"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A: Via Website (Easiest)**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click **"Add New Project"**
4. Import your repository
5. Click **Deploy** (Vercel auto-detects Vite settings)

**Option B: Via CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### Step 3: Add Environment Variables (Optional - for Auth)

After deployment, in Vercel project settings:
1. Go to **Settings → Environment Variables**
2. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase key
3. **Redeploy** your project

## 🎉 Done!

Your app will be live at: `https://your-project.vercel.app`

---

## 📝 Notes:

- The app works **without** Supabase (auth will show as disabled)
- To enable auth, set up Supabase and add the environment variables
- All your quick rolls will work with cookies until you enable Supabase
- Vercel automatically handles builds and deployments

