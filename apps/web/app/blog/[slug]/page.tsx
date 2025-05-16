import MarkdownRenderer from "@/components/blog/markdown-renderer";
import Footer from "@/components/home/footer";
import Navbar from "@/components/home/navbar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getPostData } from "@/lib/blog";
import fs from "fs";
import { notFound } from "next/navigation";
import path from "path";

const postsDirectory = path.join(process.cwd(), "content/blog");

export async function generateStaticParams() {
  try {
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames.map((fileName) => ({
      slug: fileName.replace(/\.mdx$/, ""),
    }));
  } catch (err: any) {
    return [];
  }
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const post = getPostData((await params).slug);

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
              width: 1200,
              height: 630,
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

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = getPostData((await params).slug);
  if (!post) {
    return notFound();
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
