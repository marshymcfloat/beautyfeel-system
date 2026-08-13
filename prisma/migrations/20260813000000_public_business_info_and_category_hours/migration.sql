ALTER TABLE "business_settings"
  ADD COLUMN "business_address" TEXT,
  ADD COLUMN "business_map_url" TEXT;

ALTER TABLE "service_categories"
  ADD COLUMN "available_24_hours" BOOLEAN NOT NULL DEFAULT false;

UPDATE "service_categories"
SET "available_24_hours" = true
WHERE "slug" IN ('massage-therapy', 'waxing-body-services');

INSERT INTO "flex_capacity_units" ("id", "category_id", "unit_number", "active", "created_at")
SELECT gen_random_uuid(), "id", 1, true, CURRENT_TIMESTAMP
FROM "service_categories"
WHERE "slug" IN ('massage-therapy', 'waxing-body-services')
ON CONFLICT ("category_id", "unit_number") DO UPDATE SET "active" = true;
