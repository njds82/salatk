-- Profiles table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  language CHAR(2) DEFAULT 'ar',
  theme VARCHAR(10) DEFAULT 'light',
  last_visit DATE DEFAULT CURRENT_DATE,
  initialized_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prayer Records
CREATE TABLE IF NOT EXISTS public.prayer_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  prayer_key VARCHAR(10) NOT NULL,
  status VARCHAR(10) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, prayer_key)
);

-- Qada Prayers
CREATE TABLE IF NOT EXISTS public.qada_prayers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  prayer_key VARCHAR(10) NOT NULL,
  original_date DATE,
  rakaat SMALLINT NOT NULL,
  is_manual BOOLEAN DEFAULT FALSE,
  is_made_up BOOLEAN DEFAULT FALSE,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type VARCHAR(10) NOT NULL, -- 'worship' or 'sin'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit History
CREATE TABLE IF NOT EXISTS public.habit_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  action VARCHAR(10) NOT NULL, -- 'done', 'committed', 'avoided'
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, habit_id, date)
);

-- Points History
CREATE TABLE IF NOT EXISTS public.points_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount SMALLINT NOT NULL,
  reason TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations
CREATE TABLE IF NOT EXISTS public.locations (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_manual_mode BOOLEAN DEFAULT FALSE,
  last_update TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qada_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own settings') THEN
        CREATE POLICY "Users can manage their own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own prayer records') THEN
        CREATE POLICY "Users can manage their own prayer records" ON public.prayer_records FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own qada prayers') THEN
        CREATE POLICY "Users can manage their own qada prayers" ON public.qada_prayers FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own habits') THEN
        CREATE POLICY "Users can manage their own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own habit history') THEN
        CREATE POLICY "Users can manage their own habit history" ON public.habit_history FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own points history') THEN
        CREATE POLICY "Users can manage their own points history" ON public.points_history FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own locations') THEN
        CREATE POLICY "Users can manage their own locations" ON public.locations FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Leaderboard Function/View
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.full_name,
  SUM(ph.amount) as total_points,
  RANK() OVER (ORDER BY SUM(ph.amount) DESC) as ranking
FROM public.profiles p
JOIN public.points_history ph ON p.id = ph.user_id
GROUP BY p.id, p.full_name;

-- Grant access to leaderboard
GRANT SELECT ON public.leaderboard TO authenticated, anon;

-- Trigger for new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'User'), new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
;
