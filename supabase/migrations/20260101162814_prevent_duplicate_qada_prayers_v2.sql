-- Prevent duplicate Qada records for the same prayer on the same date.
-- Use a unique partial index to only enforce this for records with a valid date.
-- Manual 'unknown' entries (which will now be NULL) are allowed to be multiple.
CREATE UNIQUE INDEX IF NOT EXISTS unique_qada_dated ON qada_prayers (user_id, original_date, prayer_key) WHERE (original_date IS NOT NULL);
;
