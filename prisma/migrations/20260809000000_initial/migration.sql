-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('ONLINE', 'MESSENGER', 'PHONE', 'WALK_IN');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('AWAITING_PAYMENT', 'PENDING_VERIFICATION', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'EXPIRED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AllocationState" AS ENUM ('ACTIVE', 'RELEASED');

-- CreateEnum
CREATE TYPE "StaffingStatus" AS ENUM ('ASSIGNED', 'FLEX_RESERVED');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('UNPAID', 'CLAIMED', 'VERIFIED', 'REJECTED', 'WAIVED', 'FORFEITED');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'RETRY', 'FAILED');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "display_name" TEXT NOT NULL,
    "phone_e164" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "public_name" TEXT NOT NULL,
    "internal_name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flex_capacity_units" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "unit_number" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flex_capacity_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_centavos" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "buffer_minutes" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_services" (
    "staff_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,

    CONSTRAINT "staff_services_pkey" PRIMARY KEY ("staff_id","service_id")
);

-- CreateTable
CREATE TABLE "staff_schedule_rules" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_until" DATE,

    CONSTRAINT "staff_schedule_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_breaks" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "weekday" INTEGER,
    "date" DATE,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,

    CONSTRAINT "staff_breaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_time_off" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "staff_time_off_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Manila',
    "gcash_number" TEXT,
    "gcash_name" TEXT,
    "deposit_percent" INTEGER NOT NULL DEFAULT 20,
    "booking_interval_minutes" INTEGER NOT NULL DEFAULT 5,
    "minimum_lead_minutes" INTEGER NOT NULL DEFAULT 120,
    "maximum_advance_days" INTEGER NOT NULL DEFAULT 30,
    "hold_duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "reschedule_notice_hours" INTEGER NOT NULL DEFAULT 24,
    "flex_strict_cutoff_hours" INTEGER NOT NULL DEFAULT 48,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_hours_rules" (
    "id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "business_hours_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_closures" (
    "id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "business_closures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "public_code" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone_e164" TEXT NOT NULL,
    "source" "BookingSource" NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "staffing_status" "StaffingStatus" NOT NULL DEFAULT 'ASSIGNED',
    "subtotal_centavos" INTEGER NOT NULL,
    "deposit_centavos" INTEGER NOT NULL,
    "requested_starts_at" TIMESTAMPTZ(3) NOT NULL,
    "requested_ends_at" TIMESTAMPTZ(3) NOT NULL,
    "hold_expires_at" TIMESTAMPTZ(3),
    "guest_token_hash" TEXT,
    "reschedule_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_services" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "service_name" TEXT NOT NULL,
    "price_centavos" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "buffer_minutes" INTEGER NOT NULL,

    CONSTRAINT "booking_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_segments" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "booking_service_id" UUID NOT NULL,
    "staff_id" UUID,
    "flex_unit_id" UUID,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "blocked_until" TIMESTAMPTZ(3) NOT NULL,
    "execution_order" INTEGER NOT NULL,
    "allocation_state" "AllocationState" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "booking_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_alerts" (
    "id" UUID NOT NULL,
    "event_key" TEXT NOT NULL,
    "booking_id" UUID,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "from_status" "BookingStatus",
    "to_status" "BookingStatus" NOT NULL,
    "actor_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "status" "DepositStatus" NOT NULL,
    "expected_centavos" INTEGER NOT NULL,
    "claimed_at" TIMESTAMPTZ(3),
    "verified_at" TIMESTAMPTZ(3),
    "owner_note" TEXT,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_outbox" (
    "id" UUID NOT NULL,
    "event_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "recipient_e164" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "provider_message_id" TEXT,
    "next_attempt_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(3),
    "last_error_code" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sms_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_rate_limits" (
    "key_hash" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "public_rate_limits_pkey" PRIMARY KEY ("key_hash","window_start")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_phone_e164_key" ON "user_profiles"("phone_e164");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_user_id_key" ON "staff_profiles"("user_id");

-- CreateIndex
CREATE INDEX "staff_profiles_active_idx" ON "staff_profiles"("active");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_slug_key" ON "service_categories"("slug");

-- CreateIndex
CREATE INDEX "flex_capacity_units_category_id_active_idx" ON "flex_capacity_units"("category_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "flex_capacity_units_category_id_unit_number_key" ON "flex_capacity_units"("category_id", "unit_number");

-- CreateIndex
CREATE INDEX "services_category_id_active_idx" ON "services"("category_id", "active");

-- CreateIndex
CREATE INDEX "staff_services_service_id_idx" ON "staff_services"("service_id");

-- CreateIndex
CREATE INDEX "staff_schedule_rules_staff_id_weekday_effective_from_idx" ON "staff_schedule_rules"("staff_id", "weekday", "effective_from");

-- CreateIndex
CREATE INDEX "staff_breaks_staff_id_date_weekday_idx" ON "staff_breaks"("staff_id", "date", "weekday");

-- CreateIndex
CREATE INDEX "staff_time_off_staff_id_starts_at_ends_at_idx" ON "staff_time_off"("staff_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "business_hours_rules_weekday_active_idx" ON "business_hours_rules"("weekday", "active");

-- CreateIndex
CREATE INDEX "business_closures_starts_at_ends_at_idx" ON "business_closures"("starts_at", "ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_public_code_key" ON "bookings"("public_code");

-- CreateIndex
CREATE INDEX "bookings_status_requested_starts_at_idx" ON "bookings"("status", "requested_starts_at");

-- CreateIndex
CREATE INDEX "bookings_customer_phone_e164_created_at_idx" ON "bookings"("customer_phone_e164", "created_at");

-- CreateIndex
CREATE INDEX "bookings_hold_expires_at_idx" ON "bookings"("hold_expires_at");

-- CreateIndex
CREATE INDEX "booking_services_booking_id_idx" ON "booking_services"("booking_id");

-- CreateIndex
CREATE INDEX "booking_segments_booking_id_execution_order_idx" ON "booking_segments"("booking_id", "execution_order");

-- CreateIndex
CREATE INDEX "booking_segments_booking_service_id_idx" ON "booking_segments"("booking_service_id");

-- CreateIndex
CREATE INDEX "booking_segments_staff_id_starts_at_blocked_until_idx" ON "booking_segments"("staff_id", "starts_at", "blocked_until");

-- CreateIndex
CREATE INDEX "booking_segments_flex_unit_id_starts_at_blocked_until_idx" ON "booking_segments"("flex_unit_id", "starts_at", "blocked_until");

-- CreateIndex
CREATE UNIQUE INDEX "admin_alerts_event_key_key" ON "admin_alerts"("event_key");

-- CreateIndex
CREATE INDEX "admin_alerts_read_at_created_at_idx" ON "admin_alerts"("read_at", "created_at");

-- CreateIndex
CREATE INDEX "booking_status_history_booking_id_created_at_idx" ON "booking_status_history"("booking_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_booking_id_key" ON "deposits"("booking_id");

-- CreateIndex
CREATE INDEX "deposits_status_idx" ON "deposits"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sms_outbox_event_key_key" ON "sms_outbox"("event_key");

-- CreateIndex
CREATE INDEX "sms_outbox_status_next_attempt_at_idx" ON "sms_outbox"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "public_rate_limits_expires_at_idx" ON "public_rate_limits"("expires_at");

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flex_capacity_units" ADD CONSTRAINT "flex_capacity_units_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_schedule_rules" ADD CONSTRAINT "staff_schedule_rules_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_breaks" ADD CONSTRAINT "staff_breaks_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_time_off" ADD CONSTRAINT "staff_time_off_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_segments" ADD CONSTRAINT "booking_segments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_segments" ADD CONSTRAINT "booking_segments_booking_service_id_fkey" FOREIGN KEY ("booking_service_id") REFERENCES "booking_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_segments" ADD CONSTRAINT "booking_segments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_segments" ADD CONSTRAINT "booking_segments_flex_unit_id_fkey" FOREIGN KEY ("flex_unit_id") REFERENCES "flex_capacity_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_alerts" ADD CONSTRAINT "admin_alerts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Resource allocation invariants. These remain authoritative even when a
-- browser has stale Realtime data.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "booking_segments"
  ADD CONSTRAINT "booking_segments_exactly_one_resource_chk"
    CHECK (("staff_id" IS NOT NULL)::integer + ("flex_unit_id" IS NOT NULL)::integer = 1),
  ADD CONSTRAINT "booking_segments_time_order_chk"
    CHECK ("starts_at" < "ends_at" AND "ends_at" <= "blocked_until");

ALTER TABLE "booking_segments"
  ADD CONSTRAINT "booking_segments_staff_time_excl"
  EXCLUDE USING gist (
    "staff_id" WITH =,
    tstzrange("starts_at", "blocked_until", '[)') WITH &&
  ) WHERE ("allocation_state" = 'ACTIVE' AND "staff_id" IS NOT NULL);

ALTER TABLE "booking_segments"
  ADD CONSTRAINT "booking_segments_flex_time_excl"
  EXCLUDE USING gist (
    "flex_unit_id" WITH =,
    tstzrange("starts_at", "blocked_until", '[)') WITH &&
  ) WHERE ("allocation_state" = 'ACTIVE' AND "flex_unit_id" IS NOT NULL);

CREATE UNIQUE INDEX "booking_segments_one_active_assignment_idx"
  ON "booking_segments" ("booking_service_id")
  WHERE "allocation_state" = 'ACTIVE';

-- Supabase Realtime broadcasts contain invalidation metadata only. On plain
-- PostgreSQL these triggers become safe no-ops because the realtime schema is
-- not installed.
CREATE OR REPLACE FUNCTION public.beautyfeel_send_invalidation(
  event_name text,
  topic_suffix text,
  local_date text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF to_regprocedure('realtime.send(jsonb,text,text,boolean)') IS NULL THEN
    RETURN;
  END IF;
  PERFORM realtime.send(
    jsonb_build_object('date', local_date, 'revision', floor(extract(epoch from clock_timestamp()) * 1000)),
    event_name,
    'availability:' || topic_suffix,
    false
  );
  PERFORM realtime.send(
    jsonb_build_object('date', local_date, 'revision', floor(extract(epoch from clock_timestamp()) * 1000)),
    event_name,
    'schedule:' || topic_suffix,
    true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.beautyfeel_broadcast_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  event_time timestamptz;
  local_date text;
BEGIN
  event_time := COALESCE(NEW.requested_starts_at, OLD.requested_starts_at);
  local_date := (event_time AT TIME ZONE 'Asia/Manila')::date::text;
  PERFORM public.beautyfeel_send_invalidation(TG_OP, local_date, local_date);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.beautyfeel_broadcast_segment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  local_date text;
BEGIN
  SELECT (b.requested_starts_at AT TIME ZONE 'Asia/Manila')::date::text
    INTO local_date
    FROM public.bookings b
    WHERE b.id = COALESCE(NEW.booking_id, OLD.booking_id);
  IF local_date IS NOT NULL THEN
    PERFORM public.beautyfeel_send_invalidation(TG_OP, local_date, local_date);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.beautyfeel_broadcast_configuration_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.beautyfeel_send_invalidation(TG_OP, 'all', NULL);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER beautyfeel_booking_realtime
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.beautyfeel_broadcast_booking_change();

CREATE TRIGGER beautyfeel_segment_realtime
AFTER INSERT OR UPDATE OR DELETE ON public.booking_segments
FOR EACH ROW EXECUTE FUNCTION public.beautyfeel_broadcast_segment_change();

CREATE TRIGGER beautyfeel_staff_schedule_realtime
AFTER INSERT OR UPDATE OR DELETE ON public.staff_schedule_rules
FOR EACH ROW EXECUTE FUNCTION public.beautyfeel_broadcast_configuration_change();
CREATE TRIGGER beautyfeel_staff_break_realtime
AFTER INSERT OR UPDATE OR DELETE ON public.staff_breaks
FOR EACH ROW EXECUTE FUNCTION public.beautyfeel_broadcast_configuration_change();
CREATE TRIGGER beautyfeel_staff_time_off_realtime
AFTER INSERT OR UPDATE OR DELETE ON public.staff_time_off
FOR EACH ROW EXECUTE FUNCTION public.beautyfeel_broadcast_configuration_change();
CREATE TRIGGER beautyfeel_staff_skill_realtime
AFTER INSERT OR UPDATE OR DELETE ON public.staff_services
FOR EACH ROW EXECUTE FUNCTION public.beautyfeel_broadcast_configuration_change();
CREATE TRIGGER beautyfeel_flex_capacity_realtime
AFTER INSERT OR UPDATE OR DELETE ON public.flex_capacity_units
FOR EACH ROW EXECUTE FUNCTION public.beautyfeel_broadcast_configuration_change();
CREATE TRIGGER beautyfeel_business_hours_realtime
AFTER INSERT OR UPDATE OR DELETE ON public.business_hours_rules
FOR EACH ROW EXECUTE FUNCTION public.beautyfeel_broadcast_configuration_change();
CREATE TRIGGER beautyfeel_closure_realtime
AFTER INSERT OR UPDATE OR DELETE ON public.business_closures
FOR EACH ROW EXECUTE FUNCTION public.beautyfeel_broadcast_configuration_change();

DO $$
BEGIN
  IF to_regclass('realtime.messages') IS NOT NULL
     AND to_regprocedure('auth.uid()') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY "beautyfeel staff receive private schedule broadcasts"
      ON realtime.messages FOR SELECT TO authenticated
      USING (
        (select realtime.topic()) LIKE 'schedule:%'
        AND EXISTS (
          SELECT 1 FROM public.user_profiles p
          WHERE p.id = (select auth.uid()) AND p.active = true
        )
      )
    $policy$;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
