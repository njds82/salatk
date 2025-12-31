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
DROP VIEW IF EXISTS leaderboard;
CREATE VIEW leaderboard AS
SELECT 
    p.id as user_id,
    COALESCE(NULLIF(p.full_name, ''), p.username, 'مستخدم صلاتك') as full_name,
    p.username,
    COALESCE(SUM(ph.amount), 0) as total_points,
    COUNT(ph.id) as total_activities,
    p.created_at,
    -- Calculate completion rate: (prayers done / (total unique days * 5 prayers)) * 100
    CASE 
        WHEN COUNT(DISTINCT pr.date) > 0 
        THEN (COUNT(CASE WHEN pr.status = 'done' THEN 1 END)::FLOAT / 
              (COUNT(DISTINCT pr.date) * 5.0)) * 100.0
        ELSE 0 
    END as completion_rate
FROM 
    profiles p
LEFT JOIN 
    points_history ph ON ph.user_id = p.id
LEFT JOIN 
    prayer_records pr ON pr.user_id = p.id
GROUP BY 
    p.id, p.full_name, p.username, p.created_at
ORDER BY 
    total_points DESC, 
    completion_rate DESC,
    p.created_at ASC;
