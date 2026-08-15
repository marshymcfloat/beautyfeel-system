ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'BOOKING_ASSISTANT';

CREATE TEMP TABLE "staff_capacity_map" AS
SELECT DISTINCT
  bs."service_id",
  s."category_id",
  seg."staff_id",
  DENSE_RANK() OVER (PARTITION BY s."category_id" ORDER BY seg."staff_id")
    + COALESCE((SELECT MAX(f."unit_number") FROM "flex_capacity_units" f WHERE f."category_id" = s."category_id"), 0) AS "unit_number"
FROM "booking_segments" seg
JOIN "booking_services" bs ON bs."id" = seg."booking_service_id"
JOIN "services" s ON s."id" = bs."service_id"
WHERE seg."staff_id" IS NOT NULL;

INSERT INTO "flex_capacity_units" ("id", "category_id", "unit_number", "active", "created_at")
SELECT gen_random_uuid(), "category_id", "unit_number", true, CURRENT_TIMESTAMP
FROM "staff_capacity_map"
GROUP BY "category_id", "unit_number"
ON CONFLICT ("category_id", "unit_number") DO UPDATE SET "active" = true;

UPDATE "booking_segments" seg
SET "flex_unit_id" = unit."id", "staff_id" = NULL
FROM "booking_services" bs
JOIN "services" s ON s."id" = bs."service_id"
JOIN "staff_capacity_map" map ON map."service_id" = bs."service_id"
JOIN "flex_capacity_units" unit ON unit."category_id" = map."category_id" AND unit."unit_number" = map."unit_number"
WHERE seg."booking_service_id" = bs."id" AND seg."staff_id" = map."staff_id";

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "booking_segments" WHERE "staff_id" IS NOT NULL OR "flex_unit_id" IS NULL) THEN
    RAISE EXCEPTION 'Treatment-staff segment conversion was incomplete';
  END IF;
END $$;

UPDATE "booking_segments" SET "completed_by_id" = NULL
WHERE "completed_by_id" IN (SELECT "user_id" FROM "staff_profiles");
UPDATE "booking_status_history" SET "actor_id" = NULL
WHERE "actor_id" IN (SELECT "user_id" FROM "staff_profiles");
UPDATE "audit_logs" SET "actor_id" = NULL
WHERE "actor_id" IN (SELECT "user_id" FROM "staff_profiles");
DELETE FROM "staff_time_off";
DELETE FROM "staff_breaks";
DELETE FROM "staff_schedule_rules";
DELETE FROM "staff_services";
DELETE FROM "staff_profiles";
DELETE FROM "user_profiles" WHERE "role" = 'STAFF';

UPDATE "bookings" SET "staffing_status" = 'ASSIGNED';
DELETE FROM "admin_alerts" WHERE "type" = 'STAFFING' OR "event_key" LIKE '%:STAFFING:%';
