import { BlogCard, type BlogPost } from "@/components/blog-card";
import Footer from "@/components/home/footer";
import Navbar from "@/components/home/navbar";
import fs from "fs";
import matter from "gray-matter";
import path from "path";

const postsDirectory = path.join(process.cwd(), "content/blog");

function getSortedPostsData(): BlogPost[] {
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

export default function BlogPage() {
  const posts = getSortedPostsData();

  return (
    <div className="flex flex-col w-full">
      <Navbar />
      <div className="max-w-5xl px-6 mx-auto w-full">
        <div className="py-12  text-2.5xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
          <h1 className="">Blog</h1>
        </div>
        <div className="relative z-0 mx-auto max-w-grid-width">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-y divide-gray-200">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
