import { googleSearchConsoleAuth } from "@/lib/auth";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const state = generateState();

  const codeVerifier = generateCodeVerifier();
  const nextUrl = await googleSearchConsoleAuth.createAuthorizationURL(
    state,
    codeVerifier,
    ["https://www.googleapis.com/auth/webmasters"]
  );

  const cookiesHeader = await cookies();
  if (slug) {
    cookiesHeader.set("gsc_website_slug", slug, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax",
    });
  }
  cookiesHeader.set("google_search_console_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  });

  (await cookies()).set("google_search_console_code_verifier", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  const lastUrl = new URL(nextUrl);
  lastUrl.searchParams.set("access_type", "offline");
  lastUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(lastUrl);
}
