-- Drop view first because we are changing the schema (removing email column)
DROP VIEW IF EXISTS leaderboard;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT TO authenticated USING (true);

-- 2. Points History Policies
DROP POLICY IF EXISTS "Users can manage their own points" ON points_history;
DROP POLICY IF EXISTS "Everyone can read points for leaderboard" ON points_history;

CREATE POLICY "Users can manage their own points" ON points_history
    FOR ALL TO authenticated USING (auth.uid() = user_id);
    
CREATE POLICY "Everyone can read points for leaderboard" ON points_history
    FOR SELECT TO authenticated USING (true);

-- 3. Create Leaderboard View
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ph.amount), 0) DESC, p.created_at ASC) as ranking,
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
    total_points DESC, p.created_at ASC;

-- Grant access
GRANT SELECT ON leaderboard TO authenticated;
;
