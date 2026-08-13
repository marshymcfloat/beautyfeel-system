import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const categories = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Skin Care Treatments", slug: "skin-care-treatments", sortOrder: 1 },
  { id: "10000000-0000-4000-8000-000000000002", name: "Massage & Spa Services", slug: "massage-therapy", sortOrder: 2, available24Hours: true },
  { id: "10000000-0000-4000-8000-000000000003", name: "Eyelash & Eyebrow Services", slug: "eyelash-eyebrow-services", sortOrder: 3 },
  { id: "10000000-0000-4000-8000-000000000004", name: "Nail Care", slug: "nail-care", sortOrder: 4 },
  { id: "10000000-0000-4000-8000-000000000005", name: "Waxing & Body Services", slug: "waxing-body-services", sortOrder: 5, available24Hours: true },
] as const;

type ServiceSeed = {
  id: string;
  categoryId: string;
  name: string;
  priceCentavos: number;
  durationMinutes: number;
  bufferMinutes: number;
  description?: string;
  active?: boolean;
};

let serviceNumber = 0;
const service = (categoryId: string, name: string, pricePesos: number, durationMinutes: number, options: { buffer?: number; description?: string; active?: boolean } = {}): ServiceSeed => ({
  id: `20000000-0000-4000-8000-${String(++serviceNumber).padStart(12, "0")}`,
  categoryId,
  name,
  priceCentavos: pricePesos * 100,
  durationMinutes,
  bufferMinutes: options.buffer ?? 10,
  description: options.description,
  active: options.active ?? true,
});

const [skin, massage, lashes, nails, waxing] = categories.map((category) => category.id);

const services: ServiceSeed[] = [
  service(nails, "Manicure Gel", 280, 60),
  service(nails, "Pedicure Gel", 300, 60),
  service(nails, "Foot Spa", 250, 60),
  service(nails, "Foot Spa with Regular Gel", 430, 90),
  service(nails, "Soft Gel Nail Extensions", 699, 120, { buffer: 15 }),
  service(nails, "Regular Manicure", 150, 45),

  service(lashes, "Classic Eyelash Extensions", 399, 90, { buffer: 15 }),
  service(lashes, "Wispy Eyelash Extensions", 450, 120, { buffer: 15 }),
  service(lashes, "Doll Eye Eyelash Extensions", 450, 120, { buffer: 15 }),
  service(lashes, "Cat Eye Eyelash Extensions", 450, 120, { buffer: 15 }),
  service(lashes, "Volume Eyelash Extensions", 500, 120, { buffer: 15 }),
  service(lashes, "Eyelash Perming", 399, 60),
  service(lashes, "Eyelash Perm with Tint", 450, 75),
  service(lashes, "Eyebrow Lamination", 450, 60),

  service(waxing, "Underarm Wax", 350, 30),
  service(waxing, "Whole Arm Wax", 350, 45),
  service(waxing, "Half Legs Wax", 350, 45),
  service(waxing, "Whole Legs Wax", 450, 60),
  service(waxing, "Brazilian Wax", 800, 60, { buffer: 15 }),
  service(waxing, "Whole Body Scrub", 750, 90, { buffer: 15 }),

  service(skin, "Deep Cleaning Facial", 800, 60, { buffer: 15 }),
  service(skin, "Lightening Facial", 1200, 60, { buffer: 15 }),
  service(skin, "HydraDerma Facial", 1500, 90, { buffer: 15 }),
  service(skin, "Wart Treatment", 800, 60, { buffer: 15, description: "Price starts at ₱800 and depends on the treatment area." }),
  service(skin, "Acne Facial", 999, 75, { buffer: 15 }),
  service(skin, "BB Glow with Cheek Blush", 2300, 90, { buffer: 15 }),
  service(skin, "Carbon Laser Deluxe", 1900, 75, { buffer: 15 }),
  service(skin, "CO2 Fractional Laser", 5000, 90, { buffer: 20 }),
  service(skin, "Microneedling", 3500, 90, { buffer: 20 }),
  service(skin, "IPL Hair Growth Treatment", 500, 45, { buffer: 15 }),
  service(skin, "Exilift", 899, 60, { buffer: 15, description: "Price starts at ₱899." }),
  service(skin, "Mesolipo", 0, 60, { buffer: 15, description: "Price to be announced.", active: false }),
  service(skin, "Skin Booster", 0, 60, { buffer: 15, description: "Price to be announced.", active: false }),
  service(skin, "Glutathione Drip and Push", 800, 60, { buffer: 15, description: "Price starts at ₱800." }),

  service(massage, "60-Minute Swedish Massage", 500, 60, { buffer: 15 }),
  service(massage, "60-Minute Combination Massage", 600, 60, { buffer: 15 }),
  service(massage, "60-Minute Thai Massage", 700, 60, { buffer: 15 }),
  service(massage, "60-Minute Shiatsu Massage", 700, 60, { buffer: 15 }),
  service(massage, "90-Minute Traditional Massage", 800, 90, { buffer: 15 }),
  service(massage, "90-Minute Hot Stone Massage", 999, 90, { buffer: 20 }),
  service(massage, "90-Minute Ventosa Massage", 999, 90, { buffer: 20 }),
  service(massage, "Prenatal Massage", 500, 60, { buffer: 15, description: "Performed only by a DOH-licensed therapist." }),
  service(massage, "Pediatric Massage", 500, 60, { buffer: 15 }),
  service(massage, "30-Minute Back Massage", 300, 30, { buffer: 10 }),
  service(massage, "45-Minute Back and Head Massage", 400, 45, { buffer: 10 }),
  service(massage, "30-Minute Foot Reflex and Leg Massage", 300, 30, { buffer: 10 }),
  service(massage, "45-Minute Foot Reflex and Leg Massage", 400, 45, { buffer: 10 }),
];

async function main() {
  await prisma.businessSettings.upsert({ where: { id: 1 }, create: { id: 1, minimumLeadMinutes: 60 }, update: {} });
  for (const category of categories) {
    await prisma.serviceCategory.upsert({
      where: { id: category.id },
      create: category,
      update: { name: category.name, slug: category.slug, sortOrder: category.sortOrder, active: true, available24Hours: "available24Hours" in category && category.available24Hours },
    });
  }
  for (const item of services) {
    await prisma.service.upsert({
      where: { id: item.id },
      create: item,
      update: {
        categoryId: item.categoryId,
        name: item.name,
        description: item.description ?? null,
        priceCentavos: item.priceCentavos,
        durationMinutes: item.durationMinutes,
        bufferMinutes: item.bufferMinutes,
        active: item.active ?? true,
      },
    });
  }
  console.log(`Seeded ${categories.length} categories and ${services.length} services.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Database seed failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
