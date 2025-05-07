import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Google } from "arctic";
import { Lucia } from "lucia";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
    };
  },
});

export const google = new Google(
  process.env.GOOGLE_OAUTH_CLIENT_ID!,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    "http://localhost:3000/api/auth/google/callback"
);

export const googleSearchConsoleAuth = new Google(
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID!,
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET!,
  process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI ||
    "http://localhost:3000/api/auth/google/search-console/callback"
);

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    Google: typeof google; // Keep existing Google for general auth
    googleSearchConsoleAuth: typeof googleSearchConsoleAuth; // Add new one for Search Console
    DatabaseUserAttributes: {
      email: string;
    };
  }
}
