import Footer from "@/components/home/footer";
import Navbar from "@/components/home/navbar";
import MarkdownRenderer from "@/components/markdown-renderer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import fs from "fs";
import matter from "gray-matter";
import { Metadata, ResolvingMetadata } from "next";
import path from "path";

const postsDirectory = path.join(process.cwd(), "content/blog");

interface PostData {
  slug: string;
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  [key: string]: any;
}

function getPostData(slug: string): PostData {
  const fullPath = path.join(postsDirectory, `${slug}.mdx`);
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

export async function generateStaticParams() {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames.map((fileName) => ({
    slug: fileName.replace(/\.mdx$/, ""),
  }));
}

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // fetch data
  const post = getPostData(params.slug);

  // optionally access and extend (rather than replace) parent metadata
  // const previousImages = (await parent).openGraph?.images || []

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The post you are looking for does not exist.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;

  return {
    title: `Agent Writer - ${post.title}`,
    description: post.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: canonicalUrl,
      images: post.imageUrl
        ? [
            {
              url: post.imageUrl.startsWith("http")
                ? post.imageUrl
                : `${siteUrl}${post.imageUrl}`,
              width: 1200, // Adjust as needed
              height: 630, // Adjust as needed
              alt: post.title,
            },
          ]
        : [],
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.imageUrl
        ? [
            post.imageUrl.startsWith("http")
              ? post.imageUrl
              : `${siteUrl}${post.imageUrl}`,
          ]
        : [],
    },
  };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostData(params.slug);

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="flex flex-col w-full">
      <Navbar />
      <div className="max-w-4xl px-6 mx-auto w-full py-12">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{post.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <MarkdownRenderer source={post.content} />
        <Footer />
      </div>
    </div>
  );
}
