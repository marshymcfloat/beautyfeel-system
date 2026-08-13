import { prisma } from "@/lib/db/prisma";
import { getServerEnv } from "@/lib/env/server";

export async function GET() {
  try {
    const env=getServerEnv();
    const settings=await prisma.businessSettings.findUnique({where:{id:1},select:{gcashName:true,gcashNumber:true}});
    await prisma.$queryRaw`SELECT 1`;
    const checks={database:true,gcash:Boolean(settings?.gcashName&&settings.gcashNumber),supabase:Boolean(env.SUPABASE_URL&&env.SUPABASE_SECRET_KEY),sms:Boolean(env.SEMAPHORE_API_KEY),cron:true,tokenPepper:true};
    const ready=Object.values(checks).every(Boolean);
    return Response.json({ok:ready,checks},{status:ready?200:503,headers:{"cache-control":"no-store"}});
  } catch { return Response.json({ok:false,checks:{database:false}},{status:503,headers:{"cache-control":"no-store"}}); }
}
