-- ========================================
-- Leaderboard View
-- ========================================
-- This view calculates the total points for each user and ranks them

-- Create a materialized view for better performance
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY total_points DESC) as ranking,
    u.id as user_id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)) as full_name,
    COALESCE(SUM(ph.amount), 0) as total_points,
    COUNT(ph.id) as total_activities
FROM 
    auth.users u
LEFT JOIN 
    points_history ph ON ph.user_id = u.id
GROUP BY 
    u.id, u.email, u.raw_user_meta_data
HAVING 
    COALESCE(SUM(ph.amount), 0) > 0  -- Only show users with points
ORDER BY 
    total_points DESC;

-- Grant access to authenticated users
GRANT SELECT ON leaderboard TO authenticated;

-- Note: This view automatically updates when points_history changes
-- For better performance with large datasets, consider using a materialized view:
-- CREATE MATERIALIZED VIEW leaderboard_materialized AS ...
-- And refresh it periodically with: REFRESH MATERIALIZED VIEW leaderboard_materialized;
