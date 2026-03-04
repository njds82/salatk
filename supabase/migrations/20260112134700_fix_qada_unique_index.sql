DROP INDEX IF EXISTS unique_qada_dated;
CREATE UNIQUE INDEX unique_qada_dated ON public.qada_prayers (user_id, original_date, prayer_key);;
