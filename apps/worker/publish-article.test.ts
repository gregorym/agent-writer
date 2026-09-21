import { describe, expect, it, vi } from "vitest";

// The real @tryghost/admin-api pulls a CJS dep chain (jwa) that breaks under
// vitest's ESM transform; the Notion path never touches it.
vi.mock("@tryghost/admin-api", () => ({ default: class {} }));

import {
  markdownToNotionBlocks,
  publishToNotion,
} from "./src/publish-article";

const article = {
  id: 1,
  title: "My Article",
  description: "desc",
  markdown: [
    "# My Article",
    "",
    "Intro paragraph.",
    "",
    "## Section",
    "",
    "- one",
    "- two",
    "",
    "1. first",
    "",
    "![alt text](https://example.com/img.png)",
    "",
    "```js",
    "const x = 1;",
    "```",
    "",
    "Closing paragraph.",
  ].join("\n"),
};

describe("markdownToNotionBlocks", () => {
  it("converts headings, paragraphs, lists, images and code", () => {
    const blocks = markdownToNotionBlocks(article.markdown);

    expect(blocks.map((b) => b.type)).toEqual([
      "heading_1",
      "paragraph",
      "heading_2",
      "bulleted_list_item",
      "bulleted_list_item",
      "numbered_list_item",
      "image",
      "code",
      "paragraph",
    ]);

    expect(blocks[0].heading_1.rich_text[0].text.content).toBe("My Article");
    expect(blocks[2].heading_2.rich_text[0].text.content).toBe("Section");
    expect(blocks[3].bulleted_list_item.rich_text[0].text.content).toBe("one");
    expect(blocks[5].numbered_list_item.rich_text[0].text.content).toBe(
      "first"
    );
    expect(blocks[6].image.external.url).toBe("https://example.com/img.png");
    expect(blocks[6].image.caption[0].text.content).toBe("alt text");
    expect(blocks[7].code.language).toBe("js");
    expect(blocks[7].code.rich_text[0].text.content).toBe("const x = 1;");
    expect(blocks[8].paragraph.rich_text[0].text.content).toBe(
      "Closing paragraph."
    );
  });

  it("returns no blocks for empty markdown", () => {
    expect(markdownToNotionBlocks("")).toEqual([]);
    expect(markdownToNotionBlocks("\n\n")).toEqual([]);
  });

  it("keeps unclosed code fences", () => {
    const blocks = markdownToNotionBlocks("```\nstill code");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("code");
    expect(blocks[0].code.rich_text[0].text.content).toBe("still code");
  });
});

describe("publishToNotion", () => {
  const notion = { api_key: "secret_test", database_id: "db-123" };

  it("throws when database_id is missing", async () => {
    await expect(
      publishToNotion(article, { api_key: "secret_test", database_id: null })
    ).rejects.toThrow(/database_id is missing/);
  });

  it("creates a page with the title and blocks", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "page-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await publishToNotion(article, notion);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string>; body: string }
    ];
    expect(url).toBe("https://api.notion.com/v1/pages");
    const payload = JSON.parse(init.body);
    expect(payload.parent).toEqual({ database_id: "db-123" });
    expect(payload.properties.title[0].text.content).toBe("My Article");
    expect(payload.children).toHaveLength(9);
    expect(init.headers.Authorization).toBe("Bearer secret_test");
    vi.unstubAllGlobals();
  });

  it("chunks more than 98 blocks via append calls", async () => {
    const bigMarkdown = Array.from(
      { length: 200 },
      (_, i) => `para ${i}`
    ).join("\n");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "page-2" }),
      })
      .mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await publishToNotion({ ...article, markdown: bigMarkdown }, notion);

    expect(fetchMock).toHaveBeenCalledTimes(3); // 98 + 98 + 4
    const [createUrl, createInit] = fetchMock.mock.calls[0] as [
      string,
      { body: string }
    ];
    expect(createUrl).toBe("https://api.notion.com/v1/pages");
    expect(JSON.parse(createInit.body).children).toHaveLength(98);
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://api.notion.com/v1/blocks/page-2/children"
    );
    expect(
      JSON.parse((fetchMock.mock.calls[1][1] as { body: string }).body)
        .children
    ).toHaveLength(98);
    expect(
      JSON.parse((fetchMock.mock.calls[2][1] as { body: string }).body)
        .children
    ).toHaveLength(4);
    vi.unstubAllGlobals();
  });

  it("throws on a failed create response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"code":"unauthorized"}',
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(publishToNotion(article, notion)).rejects.toThrow(
      /Notion create page failed \(401\)/
    );
    vi.unstubAllGlobals();
  });
});
