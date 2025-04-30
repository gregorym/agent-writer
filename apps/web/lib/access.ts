import { prisma } from "./prisma";

export const verifyWebsiteAccess = async (userId: string, slug: string) => {
  const website = await prisma.website.findUnique({
    where: { slug, user_id: userId },
    select: { id: true },
  });
  return website?.id ? true : false;
};
