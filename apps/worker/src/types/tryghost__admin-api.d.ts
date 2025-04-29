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
    // Add other post properties as needed
  }

  interface GhostPostAddOptions {
    source?: "html" | "markdown";
    // Add other options as needed
  }

  class GhostAdminAPI {
    constructor(options: GhostAdminAPIOptions);
    posts: {
      add(post: GhostPost, options?: GhostPostAddOptions): Promise<any>; // Replace 'any' with a more specific type if known
      // Add other post methods as needed (e.g., edit, browse, read, delete)
    };
    // Add other API endpoints as needed (e.g., pages, tags, members)
  }

  export default GhostAdminAPI;
}
