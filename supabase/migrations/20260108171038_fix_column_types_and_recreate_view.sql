-- Drop dependent views
DROP VIEW IF EXISTS leaderboard;

-- Alter column types
ALTER TABLE user_settings ALTER COLUMN theme TYPE TEXT;
ALTER TABLE prayer_records ALTER COLUMN prayer_key TYPE TEXT;
ALTER TABLE prayer_records ALTER COLUMN status TYPE TEXT;
ALTER TABLE qada_prayers ALTER COLUMN prayer_key TYPE TEXT;
ALTER TABLE habits ALTER COLUMN type TYPE TEXT;
ALTER TABLE habit_history ALTER COLUMN action TYPE TEXT;

-- Recreate leaderboard view (using the exact same logic as before)
CREATE VIEW leaderboard AS
 WITH user_points AS (
         SELECT points_history.user_id,
            sum(points_history.amount) AS total_points,
            count(points_history.id) AS total_activities
           FROM points_history
          GROUP BY points_history.user_id
        ), user_prayers AS (
         SELECT prayer_records.user_id,
            count(*) FILTER (WHERE ((prayer_records.status)::text = 'done'::text)) AS performed_count,
            count(DISTINCT prayer_records.date) AS days_tracked
           FROM prayer_records
          GROUP BY prayer_records.user_id
        )
 SELECT p.id AS user_id,
    COALESCE(NULLIF(p.full_name, ''::text), p.username, 'مستخدم صلاتك'::text) AS full_name,
    p.username,
    COALESCE(up.total_points, (0)::bigint) AS total_points,
    COALESCE(up.total_activities, (0)::bigint) AS total_activities,
    p.created_at,
        CASE
            WHEN (COALESCE(upra.days_tracked, (0)::bigint) > 0) THEN (((upra.performed_count)::double precision / (((upra.days_tracked)::numeric * 5.0))::double precision) * (100)::double precision)
            ELSE (0)::double precision
        END AS completion_rate
   FROM ((profiles p
     LEFT JOIN user_points up ON ((up.user_id = p.id)))
     LEFT JOIN user_prayers upra ON ((upra.user_id = p.id)))
  ORDER BY (COALESCE(up.total_points, (0)::bigint)) DESC, (
        CASE
            WHEN (COALESCE(upra.days_tracked, (0)::bigint) > 0) THEN (((upra.performed_count)::double precision / (((upra.days_tracked)::numeric * 5.0))::double precision) * (100)::double precision)
            ELSE (0)::double precision
        END) DESC, p.created_at;;
