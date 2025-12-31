-- ========================================
-- Leaderboard View
-- ========================================
-- This view calculates the total points for each user and ranks them

-- Drop the existing view to allow column structure changes
DROP VIEW IF EXISTS leaderboard;

-- Create the view with new structure
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

-- Grant access to authenticated users
GRANT SELECT ON leaderboard TO authenticated;

-- Note: This view automatically updates when points_history changes
-- For better performance with large datasets, consider using a materialized view:
-- CREATE MATERIALIZED VIEW leaderboard_materialized AS ...
-- And refresh it periodically with: REFRESH MATERIALIZED VIEW leaderboard_materialized;
