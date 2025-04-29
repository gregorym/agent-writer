import Boss from "pg-boss";
dotenv.config();

import GhostAdminAPI from "@tryghost/admin-api";
import * as dotenv from "dotenv";
import fs from "fs";
import { marked } from "marked";
import { Heading, Image } from "mdast";
import os from "os";
import path from "path";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { Node } from "unist";
import { remove } from "unist-util-remove";
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
    return ghostImage.url;
  } catch (error) {
    return null;
  } finally {
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (deleteError) {}
    }
  }
}

async function publishToGhost(article: any, ghost: any): Promise<void> {
  try {
    const api = new GhostAdminAPI({
      url: ghost.api_url,
      key: ghost.api_key,
      version: "v5.0",
    });

    const processor = unified().use(remarkParse).use(remarkStringify);

    const tree = processor.parse(article.markdown);

    let h1Removed = false;
    remove(tree, (node: Node) => {
      if (
        !h1Removed &&
        node.type === "heading" &&
        (node as Heading).depth === 1
      ) {
        h1Removed = true;
        return true;
      }
      return false;
    });

    const imagePromises: Promise<void>[] = [];
    const processedUrls = new Set<string>();
    let featureImageUrl: string | null = null; // Variable to store the first image URL

    visit(tree, "image", (node: Image) => {
      const originalUrl = node.url;

      if (
        originalUrl &&
        (originalUrl.startsWith("http://") ||
          originalUrl.startsWith("https://")) &&
        !processedUrls.has(originalUrl)
      ) {
        processedUrls.add(originalUrl);

        imagePromises.push(
          (async () => {
            const newUrl = await processAndUploadImage(originalUrl, api);
            if (newUrl) {
              node.url = newUrl;
              if (!featureImageUrl) {
                featureImageUrl = newUrl;
              }
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
        feature_image: featureImageUrl ?? undefined,
        feature_image_alt: undefined,
        feature_image_caption: undefined,
      },
      { source: "html" }
    );
  } catch (error) {
    throw error;
  }
}
