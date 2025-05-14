import Link from "next/link";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  authorName?: string;
  authorAvatarUrl?: string;
  date: string;
};

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col transition-all hover:bg-neutral-50"
    >
      <img
        src={post.imageUrl}
        alt={post.title}
        className="blur-0 aspect-[1200/630] object-cover"
        loading="lazy"
      />
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <h2 className="line-clamp-2 font-display text-lg font-bold text-neutral-900">
            {post.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm text-neutral-500">
            {post.description}
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <div className="flex items-center -space-x-2">
            <img
              alt="Greg Mars"
              loading="lazy"
              width="32"
              height="32"
              decoding="async"
              data-nimg="1"
              className="blur-0 rounded-full transition-all group-hover:brightness-90"
              src="https://cdn.nft-generator.art/images/team/greg.jpeg"
            />
          </div>
          <time dateTime={post.date} className="text-sm text-neutral-500">
            {post.date}
          </time>
        </div>
      </div>
    </Link>
  );
}
