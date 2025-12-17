# D&D Dice Roller

A beautiful, modern dice roller for Dungeons & Dragons with glassmorphism design, multiple themes, and cloud sync for your custom quick rolls.

## Features

- 🎲 Roll any D&D dice (d4, d6, d8, d10, d12, d20, d100)
- 🎨 Multiple themes (Forest Green, Pink Sparkles)
- ⚡ Quick roll buttons for common rolls
- 💾 Save custom quick rolls with modifiers
- ☁️ Cloud sync with user accounts
- 📱 Responsive design

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > API to get your:
   - Project URL
   - Anon/public key
4. In the Supabase SQL Editor, run the SQL from `supabase-schema.sql` to create the database table

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Locally

```bash
npm run dev
```

## Deploy to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Option 2: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

## Database Setup

Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor. This will:
- Create the `quick_rolls` table
- Set up Row Level Security (RLS) policies
- Ensure users can only access their own quick rolls

## Usage

1. **Sign Up/Login**: Click the auth button in the top left
2. **Roll Dice**: Select dice type, count, and modifier, then click "Roll"
3. **Quick Rolls**: Use the preset d20 buttons or create custom quick rolls
4. **Save Quick Rolls**: Click "+ Add Quick Roll" to create custom rolls with modifiers
5. **Cloud Sync**: Your quick rolls are automatically saved to your account and sync across devices

## Tech Stack

- React
- Vite
- Tailwind CSS
- Supabase (Authentication & Database)
- Vercel (Hosting)
