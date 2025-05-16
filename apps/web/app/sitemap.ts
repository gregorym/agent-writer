import { getSortedPostsData } from "@/lib/blog";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getSortedPostsData();

  const blogs = posts.map((post) => ({
    url: `https://www.agentwriter.co/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: "https://www.agentwriter.co",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://www.agentwriter.co/blog",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...blogs,
  ];
}
