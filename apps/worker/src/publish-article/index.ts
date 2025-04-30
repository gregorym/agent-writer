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
          githubIntegration: true, // Include GithubIntegration
        },
      },
    },
  });

  if (!article || !article.website) return;

  const { ghostIntegration, GithubIntegration } = article.website;

  if (ghostIntegration) {
    await publishToGhost(article, ghostIntegration);
  }

  if (GithubIntegration) {
    await publishToGithub(article, githubIntegration[0]);
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

async function publishToGithub(article: any, github: any): Promise<void> {
  try {
    const octokit = new Octokit({ auth: github.api_key });

    const { data: userData } = await octokit.users.getAuthenticated();
    const owner = userData.login;
    const repo = github.repo_name;
    if (!repo) {
      throw new Error(
        "Repository name is missing in GithubIntegration settings. Please add it in the website settings."
      );
    }

    // 2. Check if the token can access the specified repository
    try {
      await octokit.repos.get({ owner, repo });
      // If the above call succeeds, the token has access to the repo.
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(
          `Error: Cannot access repository '${owner}/${repo}'. Check repository name and token permissions.`
        );
      } else {
        // Re-throw other errors (e.g., network issues, rate limits)
        throw new Error(
          `Error verifying repository access: ${error.message || error}`
        );
      }
    }

    // --- Rest of the function remains the same ---
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

    // 2. Get the default branch
    const repoInfo = await octokit.repos.get({ owner, repo });
    const baseBranch = repoInfo.data.default_branch;

    // 3. Get the SHA of the base branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = refData.object.sha;

    // 4. Create a new branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // 5. Create the file content (MDX) with frontmatter
    const frontmatter = `---
title: "${article.title}"
description: "${article.description || ""}"
date: "${new Date(article.created_at).toISOString().split("T")[0]}"
---

`;
    const fileContent = frontmatter + article.markdown;
    const contentEncoded = Buffer.from(fileContent).toString("base64");

    // 6. Create the file on the new branch
    // Check if file exists first to update instead of create if necessary
    let existingFileSha: string | undefined;
    try {
      const { data: existingFileData } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branchName,
      });
      // Annoyingly, getContent returns an array if path is a directory,
      // or a single object if it's a file. Type checking needed.
      if (
        !Array.isArray(existingFileData) &&
        existingFileData.type === "file"
      ) {
        existingFileSha = existingFileData.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) {
        throw error; // Re-throw errors other than "not found"
      }
      // File doesn't exist, proceed to create
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: commitMessage,
      content: contentEncoded,
      branch: branchName,
      sha: existingFileSha, // Provide SHA if updating
    });

    // 7. Create a pull request
    await octokit.pulls.create({
      owner,
      repo,
      title: prTitle,
      head: branchName,
      base: baseBranch,
      body: prBody,
    });
  } catch (error) {
    // Add more specific error handling if needed
    // Avoid console.log as per instructions
    // Consider logging to a more persistent store or re-throwing
    throw error; // Re-throw to allow job tracking to catch it
  }
}
