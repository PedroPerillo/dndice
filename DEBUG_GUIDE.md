# Debug Guide: Quick Rolls Not Saving

If you're not seeing quick rolls in the database, follow these steps:

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12 or Cmd+Option+I)
2. Go to the Console tab
3. Look for any errors when:
   - Loading the page
   - Logging in
   - Adding a quick roll

## Step 2: Run Diagnostic Test

In the browser console, type:
```javascript
testSupabaseConnection()
```

This will test:
- ✅ Environment variables
- ✅ User authentication
- ✅ Database connection
- ✅ Table access (SELECT/INSERT)
- ✅ RLS policies

## Step 3: Check Common Issues

### Issue 1: Not Logged In
**Symptom**: No user email shown in top-left corner
**Fix**: Log in using the Auth component

### Issue 2: Supabase Not Configured
**Symptom**: Console shows "Supabase credentials not found"
**Fix**: 
1. Check `.env` file has:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
2. Restart dev server after adding env vars

### Issue 3: RLS Policies Blocking
**Symptom**: INSERT errors with code `42501` or `PGRST301`
**Fix**: 
1. Go to Supabase Dashboard → Authentication → Policies
2. Check `quick_rolls` table has these policies:
   - SELECT: `auth.uid() = user_id`
   - INSERT: `auth.uid() = user_id`
   - UPDATE: `auth.uid() = user_id`
   - DELETE: `auth.uid() = user_id`

### Issue 4: Table Doesn't Exist
**Symptom**: Error "relation 'quick_rolls' does not exist"
**Fix**: Run `supabase-schema.sql` in Supabase SQL Editor

### Issue 5: Wrong User ID
**Symptom**: Data saves but doesn't show up
**Fix**: Check if `user.id` matches the `user_id` in database rows

## Step 4: Manual Database Check

1. Go to Supabase Dashboard → Table Editor
2. Select `quick_rolls` table
3. Check if any rows exist
4. If rows exist, check:
   - `user_id` matches your logged-in user ID
   - Data looks correct

## Step 5: Check Network Tab

1. Open Developer Tools → Network tab
2. Filter by "rest" or "quick_rolls"
3. Try adding a quick roll
4. Check if:
   - Request is being sent
   - Response status (200 = success, 4xx/5xx = error)
   - Response body for error messages

## Step 6: Verify Service Functions

The CRUD service is in `src/services/quickRollsService.js`. It includes:
- `createQuickRoll()` - Creates new rolls
- `getQuickRolls()` - Fetches user's rolls
- `updateQuickRoll()` - Updates existing rolls
- `deleteQuickRoll()` - Deletes rolls

All functions log to console with emojis:
- ✅ = Success
- ❌ = Error
- 📖 = Reading
- 🔄 = Updating
- 🗑️ = Deleting

## Still Not Working?

1. Check the exact error message in console
2. Verify Supabase URL and key are correct
3. Make sure you're logged in
4. Check RLS policies are enabled and correct
5. Try running the diagnostic test again

