-- ========================================
-- Row Level Security (RLS) Policies
-- ========================================

-- Enable RLS on all tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE qada_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 1. User Settings Policy
CREATE POLICY "Users can manage their own settings" ON user_settings
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Prayer Records Policy
CREATE POLICY "Users can manage their own prayers" ON prayer_records
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
-- Prevent future dating (Optional Hardening)
-- CREATE POLICY "Prayers cannot be in future" ON prayer_records
--    WITH CHECK (date <= CURRENT_DATE);

-- 3. Qada Prayers Policy
CREATE POLICY "Users can manage their own qada" ON qada_prayers
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Habits Policy
CREATE POLICY "Users can manage their own habits" ON habits
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Habit History Policy
CREATE POLICY "Users can manage their own habit history" ON habit_history
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Points History Policy
CREATE POLICY "Users can read/insert their own points" ON points_history
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
-- Note: Points logic ideally should be Server-Side via Trigger to prevent manual manipulation.
-- But for now, basic RLS ensures isolation between users.

-- 7. Locations Policy
CREATE POLICY "Users can manage their own location" ON locations
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
