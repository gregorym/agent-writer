import { PrismaClient } from "@bloggy/database";

// Declare global variable to hold the PrismaClient instance
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton instance of PrismaClient
export const prisma: PrismaClient = global.prisma || new PrismaClient();

// In development, we'll save the instance to the global object to prevent
// instantiating new clients on hot reloads
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
