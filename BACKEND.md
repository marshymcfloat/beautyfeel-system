# Beautyfeel backend

The backend uses Next.js 16 Server Actions, server-only query modules, Prisma 7,
Supabase PostgreSQL/Auth, and a transactional Semaphore SMS outbox. Frontend
routes and components are intentionally not included yet.

## Local setup

1. Copy `.env.example` to `.env.local` and replace every placeholder. Next.js
   reads `.env.local` only when the development server starts, so restart
   `npm run dev` after creating or changing it.
2. Create a Supabase project. Use its pooled PostgreSQL URL as `DATABASE_URL`
   and direct URL as `DIRECT_URL` for migrations. Configure the current
   publishable and secret API keys; legacy service-role keys are not used.
3. Run `npm run db:deploy` and `npm run db:seed`.
4. Set the owner variables, then run `npm run db:bootstrap-owner` once.
5. Configure Supabase Cron to POST `/api/jobs/booking-maintenance` every five
   minutes with `Authorization: Bearer <CRON_SECRET>`.
6. Configure business hours and an explicit flex-unit count for each service
   category. Flex capacity defaults to zero.

## Availability guarantees

- New appointments within 48 hours require qualified named staff.
- Later appointments prefer named staff, then use bounded category flex units.
- PostgreSQL exclusion constraints and serializable transactions prevent two
  active segments from owning the same staff member or flex unit at once.
- Realtime broadcasts are refresh hints only. Public payloads contain only a
  date and revision; booking submission always recalculates on the server.
- Later frontend clients subscribe to `availability:<date>` plus
  `availability:all`. Authenticated dashboards use the matching private
  `schedule:<date>` and `schedule:all` topics.
- Flex reservations create idempotent owner alerts at 48, 24, and 2 hours.

## Verification

```text
npm run db:generate
npm run typecheck
npm run lint
npm test
npm run build
```

Database constraint tests require a migrated, disposable PostgreSQL database:

```text
TEST_DATABASE_URL=<url> npm test
```

Never point `TEST_DATABASE_URL` at production because integration tests create
and delete records.

## Server interfaces

- Public actions: `createBookingHold`, `markDepositSent`
- Owner actions: service/settings/staff management, payment decisions, manual
  bookings, cancellation, rescheduling, staff reassignment, business hours,
  and category flex-capacity management
- Staff actions: password change and assigned booking completion/no-show
- Reads: public services, availability, booking queues, shared schedule, staff
  schedule, service catalog, staff directory, and business settings

Staffing mutations reject changes that would orphan future reservations.
Emergency overrides require a reason, reserve available flex capacity
atomically, and create an urgent audited alert.

All private reads and mutations re-check the Supabase user and database role on
the server. Availability is never shared-cached. Public catalog/settings reads
use Next.js cache tags.
