-- ========================================
-- Leaderboard View
-- ========================================
-- This view calculates the total points for each user and ranks them

-- Create a materialized view for better performance
-- Create the view
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

-- Note: This view automatically updates when points_history changes
-- For better performance with large datasets, consider using a materialized view:
-- CREATE MATERIALIZED VIEW leaderboard_materialized AS ...
-- And refresh it periodically with: REFRESH MATERIALIZED VIEW leaderboard_materialized;
