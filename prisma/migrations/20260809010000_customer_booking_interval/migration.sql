ALTER TABLE "business_settings"
  ALTER COLUMN "booking_interval_minutes" SET DEFAULT 15;

UPDATE "business_settings"
SET "booking_interval_minutes" = 15
WHERE "booking_interval_minutes" = 5;
