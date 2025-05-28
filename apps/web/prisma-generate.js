// prisma-generate.js - Script to handle Prisma client generation for Vercel deployment
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// This script ensures that Prisma client is generated with the correct binary targets for Vercel

try {
  console.log(
    "Ensuring Prisma client has proper binaries for Vercel deployment..."
  );

  // Create necessary directories
  const prismaClientDir = path.join(__dirname, ".prisma/client");
  const outputDir = path.join(__dirname, "node_modules/.prisma/client");

  // Also ensure .next/server exists for Vercel
  const vercelTargetDir = path.join(__dirname, ".next/server");

  // Create all required directories
  [prismaClientDir, outputDir, vercelTargetDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Path to the database package's Prisma client
  const databasePrismaClientPath = path.join(
    __dirname,
    "../../packages/database/generated/client"
  );

  // Path to the database schema file
  const databaseSchemaPath = path.join(
    __dirname,
    "../../packages/database/prisma/schema.prisma"
  );

  // Copy schema.prisma to web app's .prisma folder
  if (fs.existsSync(databaseSchemaPath)) {
    const webPrismaDir = path.join(__dirname, "prisma");
    if (!fs.existsSync(webPrismaDir)) {
      fs.mkdirSync(webPrismaDir, { recursive: true });
    }

    fs.copyFileSync(
      databaseSchemaPath,
      path.join(webPrismaDir, "schema.prisma")
    );
    console.log("Copied schema.prisma to web app");
  }

  // Array of all target directories to copy the engine to
  const targetDirs = [
    prismaClientDir,
    outputDir,
    vercelTargetDir,
    path.join(__dirname, "node_modules/@prisma/client"),
  ];

  // Copy the RHEL binary to all possible locations Vercel might look for it
  if (
    fs.existsSync(
      path.join(
        databasePrismaClientPath,
        "libquery_engine-rhel-openssl-3.0.x.so.node"
      )
    )
  ) {
    targetDirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.copyFileSync(
        path.join(
          databasePrismaClientPath,
          "libquery_engine-rhel-openssl-3.0.x.so.node"
        ),
        path.join(dir, "libquery_engine-rhel-openssl-3.0.x.so.node")
      );
    });

    console.log(
      "Successfully copied Prisma RHEL binary to all target directories"
    );
  } else {
    console.warn(
      "RHEL binary not found in database package, attempting to generate it"
    );
    // Try to regenerate if not found
    try {
      execSync("npx prisma generate", { stdio: "inherit" });
    } catch (genError) {
      console.error("Failed to generate Prisma client:", genError);
    }
  }

  console.log("Prisma setup for Vercel complete");
} catch (error) {
  console.error("Error setting up Prisma for Vercel:", error);
}
