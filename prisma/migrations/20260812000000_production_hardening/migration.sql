CREATE TYPE "TrustStatus" AS ENUM ('NORMAL', 'TRUSTED', 'BLOCKED');
CREATE TYPE "StoreCreditStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'VOIDED');
CREATE TYPE "SegmentCompletionStatus" AS ENUM ('PENDING', 'COMPLETED', 'NO_SHOW');

ALTER TABLE "business_settings"
  ADD COLUMN "verification_sla_minutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "otp_trust_days" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "cancellation_cutoff_hours" INTEGER NOT NULL DEFAULT 24;

ALTER TABLE "bookings"
  ADD COLUMN "gcash_sender_name" TEXT NOT NULL DEFAULT 'Unknown',
  ADD COLUMN "phone_verification_id" UUID,
  ADD COLUMN "policy_version" TEXT NOT NULL DEFAULT '2026-08-01',
  ADD COLUMN "policy_accepted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "risk_level" TEXT NOT NULL DEFAULT 'LOW',
  ADD COLUMN "risk_reasons" JSONB;

ALTER TABLE "booking_segments"
  ADD COLUMN "completion_status" "SegmentCompletionStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "completed_at" TIMESTAMPTZ(3),
  ADD COLUMN "completed_by_id" UUID;

ALTER TABLE "admin_alerts"
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "acknowledged_at" TIMESTAMPTZ(3),
  ADD COLUMN "acknowledged_by_id" UUID,
  ADD COLUMN "resolved_at" TIMESTAMPTZ(3);

ALTER TABLE "deposits"
  ADD COLUMN "sender_name" TEXT,
  ADD COLUMN "payment_reference" TEXT,
  ADD COLUMN "claimed_amount_centavos" INTEGER,
  ADD COLUMN "verification_due_at" TIMESTAMPTZ(3),
  ADD COLUMN "overdue_at" TIMESTAMPTZ(3),
  ADD COLUMN "escalated_at" TIMESTAMPTZ(3),
  ADD COLUMN "customer_note" TEXT;

CREATE TABLE "phone_verifications" (
  "id" UUID NOT NULL, "phone_e164" TEXT NOT NULL, "otp_hash" TEXT,
  "expires_at" TIMESTAMPTZ(3) NOT NULL, "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "resend_count" INTEGER NOT NULL DEFAULT 0, "verified_at" TIMESTAMPTZ(3),
  "consumed_at" TIMESTAMPTZ(3), "trusted_token_hash" TEXT,
  "trusted_until" TIMESTAMPTZ(3), "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "phone_verifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "phone_verifications_phone_e164_created_at_idx" ON "phone_verifications"("phone_e164", "created_at");
CREATE INDEX "phone_verifications_expires_at_idx" ON "phone_verifications"("expires_at");

CREATE TABLE "customer_trust_profiles" (
  "id" UUID NOT NULL, "phone_e164" TEXT NOT NULL, "status" "TrustStatus" NOT NULL DEFAULT 'NORMAL',
  "completed_count" INTEGER NOT NULL DEFAULT 0, "expired_hold_count" INTEGER NOT NULL DEFAULT 0,
  "rejected_claim_count" INTEGER NOT NULL DEFAULT 0, "otp_failure_count" INTEGER NOT NULL DEFAULT 0,
  "block_reason" TEXT, "blocked_until" TIMESTAMPTZ(3), "owner_note" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "customer_trust_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_trust_profiles_phone_e164_key" ON "customer_trust_profiles"("phone_e164");
CREATE INDEX "customer_trust_profiles_status_blocked_until_idx" ON "customer_trust_profiles"("status", "blocked_until");

CREATE TABLE "store_credits" (
  "id" UUID NOT NULL, "customer_phone_e164" TEXT NOT NULL, "source_booking_id" UUID NOT NULL,
  "original_centavos" INTEGER NOT NULL, "remaining_centavos" INTEGER NOT NULL,
  "status" "StoreCreditStatus" NOT NULL DEFAULT 'ACTIVE', "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "used_at" TIMESTAMPTZ(3), "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "store_credits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "store_credits_customer_phone_e164_status_expires_at_idx" ON "store_credits"("customer_phone_e164", "status", "expires_at");

CREATE TABLE "policy_versions" (
  "version" TEXT NOT NULL, "deposit_policy" TEXT NOT NULL, "cancellation_policy" TEXT NOT NULL,
  "store_credit_policy" TEXT NOT NULL, "privacy_policy" TEXT NOT NULL, "reschedule_policy" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("version")
);

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_phone_verification_id_fkey" FOREIGN KEY ("phone_verification_id") REFERENCES "phone_verifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "booking_segments" ADD CONSTRAINT "booking_segments_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_source_booking_id_fkey" FOREIGN KEY ("source_booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "policy_versions" ("version", "deposit_policy", "cancellation_policy", "store_credit_policy", "privacy_policy", "reschedule_policy") VALUES
('2026-08-01', 'A 20% GCash deposit is required before confirmation.', 'Cancelled confirmed bookings convert verified deposits to store credit.', 'Store credit is tied to the verified mobile number and expires after 12 months.', 'Contact and payment details are used only to manage the appointment and prevent abuse.', 'Contact Beautyfeel to request a schedule change. Only an owner can reschedule a booking.')
ON CONFLICT ("version") DO NOTHING;
