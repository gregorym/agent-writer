import Boss from "pg-boss";
dotenv.config();

import GhostAdminAPI from "@tryghost/admin-api";
import * as dotenv from "dotenv";
import fs from "fs";
import { marked } from "marked";
import { Image } from "mdast"; // Import Image type for specific node handling
import os from "os";
import path from "path";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify"; // Import remark-stringify
import { unified } from "unified";
import { visit } from "unist-util-visit";
import concurrentConsumer from "../utils/concurrent-consumer";
import { prisma } from "../utils/prisma";
import trackJob from "../utils/track-job";

const CONCURRENCY = 1;
const INTERVAL = 10;
export async function processAMQP(
  boss: Boss
): Promise<{ shutdown: () => Promise<void> }> {
  return concurrentConsumer(
    boss,
    "publish-article",
    CONCURRENCY,
    INTERVAL,
    async (data) => {
      return await trackJob("publish-article", data, execute(data));
    }
  );
}

export async function execute(job: any): Promise<void> {
  const { id } = job.data;

  const article = await prisma?.article.findFirst({
    where: {
      id: id,
    },
  });

  if (!article) return;

  const ghost = await prisma?.ghostIntegration.findFirst({
    where: {
      website_id: article.website_id,
    },
  });
  if (ghost) {
    await publishToGhost(article, ghost);
  }
}

/**
 * Downloads an image from a URL, saves it temporarily, and uploads it to Ghost.
 * Returns the new Ghost image URL or null if processing fails.
 * Manages temporary file cleanup.
 */
async function processAndUploadImage(
  originalUrl: string,
  api: GhostAdminAPI
): Promise<string | null> {
  let tempFilePath: string | null = null;
  try {
    const response = await fetch(originalUrl);
    if (!response.ok) {
      return null;
    }
    const imageBuffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    // 2. Create temporary file path
    let filename = path.basename(new URL(originalUrl).pathname);
    const extension =
      path.extname(filename) || `.${contentType.split("/")[1] || "tmp"}`;
    if (!filename || filename === "/") {
      filename = `image-${Date.now()}${extension}`;
    } else {
      filename = path.basename(filename, path.extname(filename)) + extension;
    }
    tempFilePath = path.join(
      os.tmpdir(),
      `ghost-upload-${Date.now()}-${filename}`
    );

    await fs.promises.writeFile(tempFilePath, Buffer.from(imageBuffer));
    const ghostImage = await api.images.upload({ file: tempFilePath });
    return ghostImage.url; // Return the new URL
  } catch (error) {
    console.error(`Failed to process image ${originalUrl}:`, error);
    return null; // Indicate failure
  } finally {
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (deleteError) {}
    }
  }
}

/**
 * Publishes an article to Ghost, handling image uploads and markdown conversion.
 */
async function publishToGhost(
  article: any, // Consider defining a stricter type for article
  ghost: any // Consider defining a stricter type for ghost integration
): Promise<void> {
  try {
    const api = new GhostAdminAPI({
      url: ghost.api_url,
      key: ghost.api_key,
      version: "v5.0",
    });

    // 1. Setup Markdown processor
    const processor = unified().use(remarkParse).use(remarkStringify); // Add stringify here

    // 2. Parse Markdown to AST
    const tree = processor.parse(article.markdown);

    // 3. Process images within the AST
    const imagePromises: Promise<void>[] = [];
    const processedUrls = new Set<string>(); // Track processed URLs to avoid duplicates

    visit(tree, "image", (node: Image) => {
      const originalUrl = node.url;

      if (
        originalUrl &&
        (originalUrl.startsWith("http://") ||
          originalUrl.startsWith("https://")) &&
        !processedUrls.has(originalUrl)
      ) {
        processedUrls.add(originalUrl); // Mark as being processed

        imagePromises.push(
          (async () => {
            const newUrl = await processAndUploadImage(originalUrl, api);
            if (newUrl) {
              // Update the node URL directly in the AST
              node.url = newUrl;
              console.log(`Updated AST node for ${originalUrl} to ${newUrl}`);
            } else {
              console.warn(
                `Keeping original URL for ${originalUrl} due to processing failure.`
              );
            }
          })()
        );
      }
    });

    await Promise.all(imagePromises);

    const updatedMarkdown = processor.stringify(tree);
    const html = await marked(updatedMarkdown);

    await api.posts.add(
      {
        title: article.title!,
        status: "draft",
        html,
      },
      { source: "html" }
    );
    console.log(`Successfully published article "${article.title}" to Ghost.`);
  } catch (error) {
    console.error("Error publishing to Ghost:", error);
    throw error; // Re-throw for job tracking
  }
}
