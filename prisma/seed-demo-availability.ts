import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const effectiveFrom = new Date("2020-01-01T00:00:00.000Z");
const demoStaff = [1, 2, 3].map((number) => ({
  number,
  userId: `30000000-0000-4000-8000-${String(number).padStart(12, "0")}`,
  staffId: `40000000-0000-4000-8000-${String(number).padStart(12, "0")}`,
  name: `Demo Staff ${number}`,
  phone: `+63900000000${number}`,
}));

async function main() {
  const services = await prisma.service.findMany({
    where: { active: true, category: { active: true } },
    select: { id: true },
  });

  if (!services.length) {
    throw new Error("No active services found. Run npm run db:seed first.");
  }

  for (const member of demoStaff) {
    await prisma.userProfile.upsert({
      where: { id: member.userId },
      create: {
        id: member.userId,
        role: "STAFF",
        displayName: member.name,
        phoneE164: member.phone,
        active: true,
        mustChangePassword: true,
      },
      update: { displayName: member.name, active: true },
    });

    await prisma.staffProfile.upsert({
      where: { id: member.staffId },
      create: {
        id: member.staffId,
        userId: member.userId,
        publicName: member.name,
        internalName: "Development availability only",
        active: true,
      },
      update: {
        publicName: member.name,
        internalName: "Development availability only",
        active: true,
      },
    });

    for (const service of services) {
      await prisma.staffService.upsert({
        where: { staffId_serviceId: { staffId: member.staffId, serviceId: service.id } },
        create: { staffId: member.staffId, serviceId: service.id },
        update: {},
      });
    }

    for (let weekday = 1; weekday <= 7; weekday += 1) {
      const suffix = String(weekday).padStart(12, "0");
      await prisma.staffScheduleRule.upsert({
        where: { id: `6${member.number}000000-0000-4000-8000-${suffix}` },
        create: {
          id: `6${member.number}000000-0000-4000-8000-${suffix}`,
          staffId: member.staffId,
          weekday,
          startMinute: 9 * 60,
          endMinute: 21 * 60,
          effectiveFrom,
        },
        update: {
          staffId: member.staffId,
          startMinute: 9 * 60,
          endMinute: 21 * 60,
          effectiveFrom,
          effectiveUntil: null,
        },
      });
    }
  }

  for (let weekday = 1; weekday <= 7; weekday += 1) {
    const suffix = String(weekday).padStart(12, "0");
    await prisma.businessHoursRule.upsert({
      where: { id: `50000000-0000-4000-8000-${suffix}` },
      create: { id: `50000000-0000-4000-8000-${suffix}`, weekday, startMinute: 9 * 60, endMinute: 21 * 60, active: true },
      update: { startMinute: 9 * 60, endMinute: 21 * 60, active: true },
    });
  }

  console.log(`Demo availability ready: ${demoStaff.length} staff members, ${services.length} skills each, daily 9:00 AM–9:00 PM schedule.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Demo availability seed failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
