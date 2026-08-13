ALTER TABLE "business_settings"
ALTER COLUMN "minimum_lead_minutes" SET DEFAULT 60;

UPDATE "business_settings"
SET "minimum_lead_minutes" = 60
WHERE "minimum_lead_minutes" = 120;
