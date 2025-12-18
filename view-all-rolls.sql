-- Query to view all quick rolls with user information
-- Run this in Supabase SQL Editor

SELECT 
  qr.id,
  au.email as user_email,
  qr.name,
  qr.count,
  qr.dice_type,
  qr.modifier,
  CONCAT(qr.count, 'd', qr.dice_type, 
    CASE 
      WHEN qr.modifier > 0 THEN CONCAT('+', qr.modifier)
      WHEN qr.modifier < 0 THEN qr.modifier::text
      ELSE ''
    END
  ) as roll_label,
  qr.created_at
FROM quick_rolls qr
LEFT JOIN auth.users au ON qr.user_id = au.id
ORDER BY qr.created_at DESC;

-- Alternative: Group by user to see how many rolls each user has
SELECT 
  au.email as user_email,
  COUNT(*) as total_rolls,
  STRING_AGG(qr.name, ', ' ORDER BY qr.created_at DESC) as roll_names
FROM quick_rolls qr
LEFT JOIN auth.users au ON qr.user_id = au.id
GROUP BY au.email
ORDER BY total_rolls DESC;

