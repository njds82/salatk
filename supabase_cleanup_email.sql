-- ========================================
-- Cleanup Email from Profiles
-- ========================================

-- 1. Ensure username column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Populate username from email if null (fallback)
UPDATE profiles 
SET username = SPLIT_PART(email, '@', 1) 
WHERE username IS NULL AND email IS NOT NULL;

-- 3. Drop email column from profiles (Remove all trace)
ALTER TABLE profiles DROP COLUMN IF EXISTS email;

-- 4. Update Leaderboard View to rely on username
-- (Assuming the view definition I saw earlier already does this or works with what we have)
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    ROW_NUMBER() OVER (
        ORDER BY COALESCE(SUM(ph.amount), 0) DESC, p.created_at ASC, p.full_name ASC
    ) as ranking,
    p.id as user_id,
    COALESCE(NULLIF(p.full_name, ''), p.username, 'مستخدم صلاتك') as full_name,
    p.username,
    COALESCE(SUM(ph.amount), 0) as total_points,
    COUNT(ph.id) as total_activities,
    p.created_at
FROM 
    profiles p
LEFT JOIN 
    points_history ph ON ph.user_id = p.id
GROUP BY 
    p.id, p.full_name, p.username, p.created_at
ORDER BY 
    ranking ASC;
