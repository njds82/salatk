-- First, add the column without errors
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Drop the view completely to avoid dependency issues with column changes
DROP VIEW IF EXISTS leaderboard;

-- Recreate the view with the filter
CREATE OR REPLACE VIEW leaderboard AS
  SELECT 
    p.id as user_id,
    p.full_name,
    p.is_public,
    COALESCE(SUM(ph.amount), 0) as total_points
  FROM profiles p
  LEFT JOIN points_history ph ON p.id = ph.user_id
  WHERE p.is_public = TRUE
  GROUP BY p.id, p.full_name, p.is_public
  ORDER BY total_points DESC;;
