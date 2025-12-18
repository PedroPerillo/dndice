# How to View All Users' Saved Quick Rolls

## Option 1: View in Supabase Dashboard (Easiest)

1. **Go to your Supabase project**: https://supabase.com/dashboard
2. **Navigate to Table Editor** (left sidebar)
3. **Click on `quick_rolls` table**
4. You'll see all quick rolls from all users with:
   - User ID
   - Name
   - Dice count and type
   - Modifier
   - Created date

You can filter, sort, and search through all the data here!

## Option 2: Use SQL Editor

1. **Go to SQL Editor** in Supabase
2. **Run this query** to see all quick rolls with user emails:

```sql
SELECT 
  qr.id,
  qr.name,
  qr.count,
  qr.dice_type,
  qr.modifier,
  qr.created_at,
  au.email as user_email
FROM quick_rolls qr
LEFT JOIN auth.users au ON qr.user_id = au.id
ORDER BY qr.created_at DESC;
```

## Option 3: Add Admin View to Your App

I've created an `AdminView` component. To use it:

1. **Import it in App.jsx**:
```jsx
import AdminView from './components/AdminView';
```

2. **Add a route or button to access it** (you can add a simple toggle)

**Note**: Due to Row Level Security (RLS), the component will only show the current user's rolls by default. To see all users' rolls, you'd need to:

- Temporarily disable RLS (not recommended for production)
- Create a database function that bypasses RLS
- Use the service role key (never expose this in frontend code!)

## Recommended: Use Supabase Dashboard

The easiest and safest way is to use the Supabase Table Editor - it shows all data and respects your security settings while giving you full visibility.

