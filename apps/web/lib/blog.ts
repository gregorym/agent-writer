import fs from "fs";
import matter from "gray-matter";
import path from "path";

const postsDirectory = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  authorName: string;
  authorAvatarUrl: string;
  [key: string]: any;
}

export interface PostData extends BlogPost {
  content: string;
}

export function getSortedPostsData(): BlogPost[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, "");

    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const matterResult = matter(fileContents);

    // Extract image from content if not in frontmatter
    let imageUrlFromContent = null;
    const imageRegex = /!\[.*?\]\((.*?)\)/; // Markdown image regex
    const match = imageRegex.exec(matterResult.content);
    if (match && match[1]) {
      imageUrlFromContent = match[1];
    }

    return {
      slug,
      title: matterResult.data.title || slug, // Fallback title to slug if not present
      description: matterResult.data.description || "",
      date: matterResult.data.date || new Date().toISOString().split("T")[0],
      imageUrl:
        matterResult.data.imageUrl ||
        matterResult.data.image ||
        imageUrlFromContent || // Use image from content as a fallback
        "/placeholder-image.jpg",
      authorName: matterResult.data.authorName,
      authorAvatarUrl: matterResult.data.authorAvatarUrl,
      ...matterResult.data,
    } as BlogPost;
  });
  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export function getPostData(slug: string): PostData {
  if (!fs.existsSync(postsDirectory)) {
    throw new Error(`Post not found: ${slug}`);
  }

  const fullPath = path.join(postsDirectory, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Post not found: ${slug}`);
  }
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  let imageUrlFromContent = null;
  const imageRegex = /!\[.*?\]\((.*?)\)/; // Markdown image regex
  const match = imageRegex.exec(matterResult.content);
  if (match && match[1]) {
    imageUrlFromContent = match[1];
  }

  return {
    slug,
    title: matterResult.data.title || slug,
    description: matterResult.data.description || "",
    date: matterResult.data.date || new Date().toISOString().split("T")[0],
    imageUrl:
      matterResult.data.imageUrl ||
      matterResult.data.image ||
      imageUrlFromContent ||
      "/placeholder-image.jpg",
    authorName: matterResult.data.authorName,
    authorAvatarUrl: matterResult.data.authorAvatarUrl,
    content: matterResult.content,
    ...matterResult.data,
  };
}
