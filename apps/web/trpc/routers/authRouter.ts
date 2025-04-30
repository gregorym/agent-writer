import { lucia } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import argon2 from "@node-rs/argon2";
import { TRPCError } from "@trpc/server";
import { generateIdFromEntropySize } from "lucia";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const authRouter = router({
  signup: publicProcedure
    .input(credentialsSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already in use",
        });
      }

      const passwordHash = await argon2.hash(password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });

      const userId = generateIdFromEntropySize(10);

      try {
        const user = await prisma.user.create({
          data: {
            id: userId,
            email,
            password_hash: passwordHash,
          },
        });

        const session = await lucia.createSession(user.id, {});

        return {
          sessionId: session.id,
          user: {
            id: user.id,
            email: user.email,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user account",
          cause: error,
        });
      }
    }),

  signin: publicProcedure
    .input(credentialsSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, password_hash: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid email or password",
        });
      }

      if (!user.password_hash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Account requires password setup",
        });
      }

      const validPassword = await argon2.verify(user.password_hash, password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });

      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const session = await lucia.createSession(user.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      return {
        sessionId: session.id,
        user: {
          id: user.id,
          email: user.email,
        },
        cookie: {
          name: sessionCookie.name,
          value: sessionCookie.value,
          options: sessionCookie.attributes,
        },
      };
    }),
});
