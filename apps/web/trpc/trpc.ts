import { lucia } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

const isAuthedMiddleware = t.middleware(async ({ ctx, next }) => {
  const cookies = ctx.cookies;

  const sessionId = cookies[lucia.sessionCookieName] ?? null;
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const { user } = await lucia.validateSession(sessionId);
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch complete user information from the database
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!fullUser) {
    throw new Error("User not found");
  }

  return next({
    ctx: {
      ...ctx,
      session: {
        user: fullUser, // Pass the complete user object
      },
    },
  });
});

const isAdminMiddleware = t.middleware(async ({ ctx, next }) => {
  // Check if user is authenticated first
  if (!ctx.session?.user) {
    throw new Error("Unauthorized");
  }

  // Since isAuthedMiddleware has already fetched the full user, we can use it directly
  const user = ctx.session.user;

  // Check if user has ADMIN role
  if (!user.role || user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  return next({
    ctx,
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthedMiddleware);
export const adminProcedure = t.procedure
  .use(isAuthedMiddleware)
  .use(isAdminMiddleware);

export const mergeRouters = t.mergeRouters;
export const createCallerFactory = t.createCallerFactory;
