-- 1. Fix Policy: Allow users to create their own profile record if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile" 
        ON public.profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 2. Repair Existing Data: Create profiles for any auth users who are missing one
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'User')
FROM auth.users
ON CONFLICT (id) DO NOTHING;
;
