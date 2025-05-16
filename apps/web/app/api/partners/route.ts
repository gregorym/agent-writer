import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

const getPartners = unstable_cache(
  async () => {
    return await prisma.website.findMany({
      where: { partner: true },
      select: { name: true, url: true },
    });
  },
  [],
  { revalidate: 86400 }
);

export async function GET() {
  const partners = await getPartners();
  return NextResponse.json(partners);
}
