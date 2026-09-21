import Boss from "pg-boss";
dotenv.config();

import { Octokit } from "@octokit/rest";
import GhostAdminAPI from "@tryghost/admin-api";
import * as dotenv from "dotenv";
import fs from "fs";
import { marked } from "marked";
import { Heading, Image } from "mdast";
import os from "os";
import path from "path";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import slugify from "slugify";
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
    include: {
      website: {
        include: {
          ghostIntegration: true,
          githubIntegration: true,
          notionIntegration: true,
        },
      },
    },
  });

  if (!article || !article.website) return;

  const { ghostIntegration, githubIntegration, notionIntegration } =
    article.website;

  if (ghostIntegration) {
    await publishToGhost(article, ghostIntegration);
  }

  if (githubIntegration) {
    await publishToGithub(article, githubIntegration);
  }

  if (notionIntegration) {
    await publishToNotion(article, notionIntegration);
  }

  await prisma?.article.update({
    where: {
      id: article.id,
    },
    data: {
      published_at: new Date(),
    },
  });
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
    let featureImageUrl: string | null = null;

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
        status: ghost.status,
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

export async function publishToNotion(article: any, notion: any): Promise<void> {
  if (!notion.database_id) {
    throw new Error(
      "Notion database_id is missing in Notion integration settings. Please add it in the website settings."
    );
  }

  const blocks = markdownToNotionBlocks(article.markdown || "");
  if (blocks.length === 0) {
    return;
  }

  const icon = firstImageSource(article.markdown || "");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${notion.api_key}`,
    "Notion-Version": "2022-06-28",
  };

  // ponytail: Notion caps a page request at 100 blocks; append the rest in
  // batches of 98. Fine for blog-length articles, revisit if articles grow.
  const firstChunk = blocks.slice(0, 98);
  const remaining = blocks.slice(98);

  const createRes = await fetch(
    `https://api.notion.com/v1/pages`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        parent: { database_id: notion.database_id },
        icon: icon
          ? { type: "external", external: { url: icon } }
          : undefined,
        properties: {
          title: [{ type: "text", text: { content: article.title! } }],
        },
        children: firstChunk,
      }),
    }
  );

  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Notion create page failed (${createRes.status}): ${body}`);
  }

  const { id: pageId } = (await createRes.json()) as { id: string };

  for (let i = 0; i < remaining.length; i += 98) {
    const chunk = remaining.slice(i, i + 98);
    const appendRes = await fetch(
      `https://api.notion.com/v1/blocks/${pageId}/children`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ children: chunk }),
      }
    );
    if (!appendRes.ok) {
      const body = await appendRes.text();
      throw new Error(
        `Notion append blocks failed (${appendRes.status}): ${body}`
      );
    }
  }
}

export function markdownToNotionBlocks(markdown: string): any[] {
  const lines = markdown.split("\n");
  const blocks: any[] = [];
  let inCode = false;
  let codeLang = "";
  let codeLines: string[] = [];
  let listType: "bulleted" | "numbered" | null = null;

  const closeList = () => {
    listType = null;
  };

  for (const line of lines) {
    if (inCode) {
      if (/^```/.test(line)) {
        blocks.push({
          object: "block",
          type: "code",
          code: {
            rich_text: [{ type: "text", text: { content: codeLines.join("\n") } }],
            language: codeLang || "plain text",
          },
        });
        inCode = false;
        codeLines = [];
      } else {
        codeLines.push(line);
      }
      continue;
    }

    const codeMatch = line.match(/^```(\w*)/);
    if (codeMatch) {
      inCode = true;
      codeLang = codeMatch[1]!;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1]!.length;
      blocks.push({
        object: "block",
        type: `heading_${level}`,
        [`heading_${level}`]: {
          rich_text: [
            { type: "text", text: { content: headingMatch[2]!.trim() } },
          ],
        },
      });
      continue;
    }

    const bulletMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (bulletMatch) {
      if (listType !== "bulleted") {
        closeList();
        listType = "bulleted";
      }
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            { type: "text", text: { content: bulletMatch[1]!.trim() } },
          ],
        },
      });
      continue;
    }

    const numberedMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    if (numberedMatch) {
      if (listType !== "numbered") {
        closeList();
        listType = "numbered";
      }
      blocks.push({
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [
            { type: "text", text: { content: numberedMatch[1]!.trim() } },
          ],
        },
      });
      continue;
    }

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)\s]+)[^)]*\)\s*$/);
    if (imageMatch) {
      closeList();
      const alt = imageMatch[1] ?? "";
      blocks.push({
        object: "block",
        type: "image",
        image: {
          type: "external",
          external: { url: imageMatch[2]! },
          caption: alt
            ? [{ type: "text", text: { content: alt } }]
            : [],
        },
      });
      continue;
    }

    if (line.trim() === "") {
      closeList();
      continue;
    }

    closeList();
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: line.trim() } }],
      },
    });
  }

  if (inCode && codeLines.length > 0) {
    blocks.push({
      object: "block",
      type: "code",
      code: {
        rich_text: [{ type: "text", text: { content: codeLines.join("\n") } }],
        language: codeLang || "plain text",
      },
    });
  }

  return blocks;
}

function firstImageSource(markdown: string): string | null {
  const match = markdown.match(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/);
  return match ? match[1]! : null;
}

async function publishToGithub(article: any, github: any): Promise<void> {
  try {
    const octokit = new Octokit({ auth: github.api_key });
    const [owner, repo] = github.repo_name.split("/");
    if (!repo) {
      throw new Error(
        "Repository name is missing in GithubIntegration settings. Please add it in the website settings."
      );
    }

    const branchName = `feat/add-article-${slugify(article.title!, {
      lower: true,
      strict: true,
    })}-${Date.now()}`;
    const filePath = path.join(
      github.dir_path || "",
      `${slugify(article.title!, { lower: true, strict: true })}.mdx`
    );
    const commitMessage = `feat: add article \"${article.title}\"`;
    const prTitle = `Add article: ${article.title}`;
    const prBody = `Adds the new article \"${article.title}\".`;

    const repoInfo = await octokit.repos.get({ owner, repo });
    const baseBranch = repoInfo.data.default_branch;

    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = refData.object.sha;

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    const frontmatter = `---
title: "${article.title}"
description: "${article.description || ""}"
date: "${new Date(article.created_at).toISOString().split("T")[0]}"
---

`;
    const fileContent = frontmatter + article.markdown;
    const contentEncoded = Buffer.from(fileContent).toString("base64");

    let existingFileSha: string | undefined;
    try {
      const { data: existingFileData } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branchName,
      });

      if (
        !Array.isArray(existingFileData) &&
        existingFileData.type === "file"
      ) {
        existingFileSha = existingFileData.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: commitMessage,
      content: contentEncoded,
      branch: branchName,
      sha: existingFileSha,
    });

    await octokit.pulls.create({
      owner,
      repo,
      title: prTitle,
      head: branchName,
      base: baseBranch,
      body: prBody,
    });
  } catch (error) {
    throw error;
  }
}
