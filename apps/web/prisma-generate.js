// prisma-generate.js - Script to handle Prisma client generation for Vercel deployment
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// This script ensures that Prisma client is generated with the correct binary targets for Vercel

try {
  // Create necessary directories
  const prismaClientDir = path.join(__dirname, ".prisma/client");
  const outputDir = path.join(__dirname, "node_modules/.prisma/client");

  // Also ensure .next/server exists for Vercel
  const vercelTargetDir = path.join(__dirname, ".next/server");
  const generatedClientDir = path.join(__dirname, "generated/client"); // Added for the missing path

  // Create all required directories
  [prismaClientDir, outputDir, vercelTargetDir, generatedClientDir].forEach(
    (dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  );

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
  }

  // Array of all target directories to copy the engine to
  const targetDirs = [
    prismaClientDir,
    outputDir,
    vercelTargetDir,
    generatedClientDir, // Added new target directory
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
  } else {
    // Try to regenerate if not found
    try {
      execSync("npx prisma generate", { stdio: "inherit" });
    } catch (genError) {
      // Error during generation, fail silently or handle as per project needs
    }
  }
} catch (error) {
  // Error during setup, fail silently or handle as per project needs
}
