import { BlogCard } from "@/components/blog-card";
import Footer from "@/components/home/footer";
import Navbar from "@/components/home/navbar";
import { getSortedPostsData, type BlogPost } from "@/lib/blog";

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
            {posts.map((post: BlogPost) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
