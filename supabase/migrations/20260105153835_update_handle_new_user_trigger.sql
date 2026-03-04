-- Update trigger function to handle referral code for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- Loop until we get a unique code
    LOOP
        new_code := generate_referral_code(6);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code);
    END LOOP;

    INSERT INTO public.profiles (id, full_name, email, referral_code)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
        NEW.email,
        new_code
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;;
