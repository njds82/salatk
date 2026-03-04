-- Drop the view first
DROP VIEW IF EXISTS leaderboard;

-- Fix points_history table
ALTER TABLE points_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE points_history DROP CONSTRAINT IF EXISTS points_history_pkey CASCADE;
ALTER TABLE points_history ALTER COLUMN id TYPE uuid USING (gen_random_uuid());
ALTER TABLE points_history ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE points_history ADD PRIMARY KEY (id);

-- Re-create the leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ph.amount), 0) DESC, p.created_at ASC) as ranking,
    p.id as user_id,
    p.email,
    COALESCE(p.full_name, SPLIT_PART(p.email, '@', 1)) as full_name,
    COALESCE(SUM(ph.amount), 0) as total_points,
    COUNT(ph.id) as total_activities
FROM 
    profiles p
LEFT JOIN 
    points_history ph ON ph.user_id = p.id
GROUP BY 
    p.id, p.email, p.full_name, p.created_at
ORDER BY 
    total_points DESC, p.created_at ASC;

-- Grant access
GRANT SELECT ON leaderboard TO authenticated;
;
