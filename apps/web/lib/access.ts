import { TRPCError } from "@trpc/server";
import { prisma } from "./prisma";

export const verifyWebsiteAccess = async (userId: string, slug: string) => {
  const website = await prisma.website.findUnique({
    where: { slug, user_id: userId },
    select: { id: true },
  });

  if (!website) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Website not found or you do not have permission to access it.",
    });
  }

  return website;
};
