declare module "@tryghost/admin-api" {
  interface GhostAdminAPIOptions {
    url: string;
    key: string;
    version: string;
  }

  interface GhostPost {
    title: string;
    html?: string;
    markdown?: string;
    status?: "published" | "draft" | "scheduled";
    feature_image?: string;
    feature_image_alt?: string;
    feature_image_caption?: string;
  }

  interface GhostPostAddOptions {
    source?: "html" | "markdown";
  }

  class GhostAdminAPI {
    constructor(options: GhostAdminAPIOptions);
    posts: {
      add(post: GhostPost, options?: GhostPostAddOptions): Promise<any>;
    };
    images: {
      upload({ file }: { file: string }): Promise<{ url: string }>;
    };
  }

  export default GhostAdminAPI;
}
