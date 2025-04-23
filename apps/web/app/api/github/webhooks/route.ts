import appFn from "@/lib/probot/app";
import { createNodeMiddleware, createProbot } from "probot";

const probot = createProbot();
const handler = createNodeMiddleware(appFn, { probot });

export async function POST(req: Request) {
  const res = new Response();
  // @ts-expect-error: Probot expects Node-style req/res
  await handler(req, res);
  return res;
}
