# Supabase + Vercel Setup Guide

## ⚠️ Important: IPv4 Compatibility

Vercel requires IPv4 connections, but Supabase's direct database connection uses IPv6. You need to use the **Session Pooler** for Vercel compatibility.

## ✅ Solution: Use Session Pooler

### Step 1: Get Your Pooler Connection String

1. In your Supabase dashboard, go to **Settings → Database**
2. Scroll down to **Connection Pooling**
3. Copy the **Session Pooler** connection string
   - It will look like: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

### Step 2: For Direct Database Access (if needed)

If you need to run SQL migrations or direct database queries from Vercel:

1. Use the **Session Pooler** connection string (not the direct connection)
2. The pooler port is usually `6543` (not `5432`)
3. Add `?pgbouncer=true` to the connection string

### Step 3: For Supabase Client (Already Configured ✅)

**Good news!** The Supabase JavaScript client we're using (`@supabase/supabase-js`) automatically handles this. You don't need to change anything in the code.

The client uses the REST API which works fine with IPv4, so your current setup is correct!

## Current Setup Status:

✅ **Supabase Client** - Works with IPv4 (no changes needed)
✅ **Environment Variables** - Set in Vercel dashboard
⏳ **Direct SQL Access** - Use Session Pooler if needed

## Environment Variables for Vercel:

Make sure these are set in your Vercel project:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

These work fine with IPv4 - no pooler needed for the client!

## If You Need to Run SQL Migrations:

If you need to run the `supabase-schema.sql` file:

1. Use the **Session Pooler** connection string
2. Or run it directly in Supabase SQL Editor (recommended)
3. The SQL Editor in Supabase dashboard works fine

## Summary:

- ✅ **Your app code is fine** - Supabase client works with IPv4
- ✅ **No code changes needed** - Just set environment variables in Vercel
- ⚠️ **Only use pooler** if you need direct database connections (we don't)

Your current setup should work perfectly on Vercel! 🚀

