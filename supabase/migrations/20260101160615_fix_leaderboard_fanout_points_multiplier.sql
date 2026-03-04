CREATE OR REPLACE VIEW leaderboard AS
WITH user_points AS (
    -- Aggregate points independently to avoid fan-out when joining other tables
    SELECT 
        user_id, 
        SUM(amount) as total_points, 
        COUNT(id) as total_activities
    FROM points_history
    GROUP BY user_id
),
user_prayers AS (
    -- Aggregate prayer stats independently
    SELECT 
        user_id,
        COUNT(*) FILTER (WHERE status = 'done') as performed_count,
        COUNT(DISTINCT date) as days_tracked
    FROM prayer_records
    GROUP BY user_id
)
SELECT 
    p.id as user_id,
    COALESCE(NULLIF(p.full_name, ''), p.username, 'مستخدم صلاتك') as full_name,
    p.username,
    COALESCE(up.total_points, 0) as total_points,
    COALESCE(up.total_activities, 0) as total_activities,
    p.created_at,
    CASE 
        WHEN COALESCE(upra.days_tracked, 0) > 0 
        THEN (upra.performed_count::float / (upra.days_tracked * 5.0)) * 100
        ELSE 0 
    END as completion_rate
FROM profiles p
LEFT JOIN user_points up ON up.user_id = p.id
LEFT JOIN user_prayers upra ON upra.user_id = p.id
ORDER BY total_points DESC, completion_rate DESC, p.created_at;
;
