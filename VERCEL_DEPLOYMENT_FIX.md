# Fix Vercel Verified Commit Issue

## Option 1: Disable Verified Commit Requirement (Easiest)

1. Go to your Vercel project: https://vercel.com/pedroperillos-projects/dndice/settings/git
2. Look for **"Deployment Protection"** or **"Git Settings"**
3. Find the setting for **"Require verified commits"** or **"Only deploy verified commits"**
4. **Disable** this setting
5. Push a new commit or manually redeploy

## Option 2: Manually Redeploy (Quick Fix)

1. Go to: https://vercel.com/pedroperillos-projects/dndice/deployments
2. Find your latest deployment
3. Click the **three dots (⋯)** menu
4. Click **"Redeploy"**
5. This will deploy your latest code without needing a verified commit

## Option 3: Set Up Commit Signing (For Future)

If you want to sign commits going forward:

### For GitHub Verified Commits:

1. **Generate a GPG key** (if you don't have one):
   ```bash
   gpg --full-generate-key
   # Choose RSA and RSA, 4096 bits
   # Set expiration (or 0 for no expiration)
   # Enter your name and email (must match GitHub email)
   ```

2. **Add GPG key to GitHub**:
   ```bash
   gpg --armor --export YOUR_KEY_ID
   # Copy the output and add it to GitHub:
   # GitHub → Settings → SSH and GPG keys → New GPG key
   ```

3. **Configure Git to sign commits**:
   ```bash
   git config --global user.signingkey YOUR_KEY_ID
   git config --global commit.gpgsign true
   ```

4. **Sign your next commit**:
   ```bash
   git commit -S -m "Your commit message"
   ```

### Quick Alternative: Use GitHub's Web Interface

You can also make small changes directly on GitHub which will create verified commits automatically.

## Recommended: Just Disable the Setting

For most projects, requiring verified commits isn't necessary. The easiest solution is to disable this requirement in Vercel settings.

