import OpenAI from "openai";
import { Probot } from "probot";
import slugify from "slugify";

export default (app: Probot) => {
  app.on("issues.labeled", async (ctx) => {
    const { label, issue } = ctx.payload;
    if (label?.name !== "blog" || issue.pull_request) return;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const topic = issue.title;
    const prompt = issue.body ?? "";

    const post =
      (
        await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a technical blogger." },
            {
              role: "user",
              content: `Write a 700-word blog post about "${topic}".\n${prompt}`,
            },
          ],
        })
      ).choices[0]?.message?.content || "No content generated";

    const slug = slugify(topic, { lower: true, strict: true });
    const branch = `blogpost/${issue.number}-${slug}`;
    const path = `blog/${new Date().toISOString().slice(0, 10)}-${slug}.md`;

    const repo = ctx.repo();
    const { data: repoMeta } = await ctx.octokit.repos.get(repo);
    const { data: branchMeta } = await ctx.octokit.repos.getBranch({
      ...repo,
      branch: repoMeta.default_branch,
    });

    await ctx.octokit.git.createRef({
      ...repo,
      ref: `refs/heads/${branch}`,
      sha: branchMeta.commit.sha,
    });

    await ctx.octokit.repos.createOrUpdateFileContents({
      ...repo,
      branch,
      path,
      message: `Add blog post for #${issue.number}`,
      content: Buffer.from(
        `---\ntitle: "${topic}"\ndate: ${new Date().toISOString()}\n---\n\n${post}`
      ).toString("base64"),
    });

    await ctx.octokit.pulls.create({
      ...repo,
      head: branch,
      base: repoMeta.default_branch,
      title: `✏️ Blog post: ${topic}`,
      body: `Auto-generated from issue #${issue.number}.`,
    });
  });
};
