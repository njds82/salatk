-- Drop the view first because it depends on the column type
DROP VIEW IF EXISTS leaderboard;

-- Change points_history.id from UUID to TEXT
ALTER TABLE points_history ALTER COLUMN id TYPE TEXT;

-- Recreate the view (using the SQL from supabase_leaderboard_view.sql as a base)
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY SUM(ph.amount) DESC, p.created_at) as ranking,
    p.id as user_id,
    COALESCE(p.full_name, 'مستخدم صلاتك') as full_name,
    COALESCE(SUM(ph.amount), 0) as total_points,
    COUNT(ph.id) as total_activities
FROM 
    profiles p
LEFT JOIN 
    points_history ph ON ph.user_id = p.id
GROUP BY 
    p.id, p.full_name, p.created_at
ORDER BY 
    total_points DESC, p.created_at;

-- Grant access to authenticated users
GRANT SELECT ON leaderboard TO authenticated;
;
