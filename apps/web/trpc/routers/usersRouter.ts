import { prisma } from "@/lib/prisma";
import { protectedProcedure, router } from "../trpc";

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx, input }) => {
    const { id: userId } = ctx.session.user;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user;
  }),
});
