ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS calculation_method text;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS madhab text;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS name text;;
