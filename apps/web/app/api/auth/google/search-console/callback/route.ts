import { googleSearchConsoleAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OAuth2RequestError } from "arctic";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface GoogleUser {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified: boolean;
  locale?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = (await cookies()).get(
    "google_search_console_oauth_state"
  )?.value;
  const storedCodeVerifier =
    (await cookies()).get("google_search_console_code_verifier")?.value ?? null;

  const websiteSlug = (await cookies()).get("gsc_website_slug")?.value;

  console.log({ code, state, storedState, storedCodeVerifier, websiteSlug });

  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    return NextResponse.json(
      { error: "Invalid request or missing website slug" },
      { status: 400 }
    );
  }

  try {
    const tokens = await googleSearchConsoleAuth.validateAuthorizationCode(
      code,
      storedCodeVerifier
    );

    console.log(tokens);

    const website = await prisma.website.findUnique({
      where: { slug: websiteSlug, user_id: "user.id" },
    });

    if (!website) {
      return NextResponse.json(
        { error: "Website not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.googleSearchIntegration.upsert({
      where: { website_id: website.id },
      update: {
        access_token: tokens.accessToken(),
        refresh_token: tokens.refreshToken(), // Asserting refreshToken is present
      },
      create: {
        website_id: website.id,
        access_token: tokens.accessToken(),
        refresh_token: tokens.refreshToken(), // Asserting refreshToken is present
      },
    });

    (await cookies()).delete("gsc_website_slug"); // Clean up cookie

    // Redirect user to a page indicating success, perhaps the integration settings page
    return NextResponse.redirect(
      new URL(`/w/${websiteSlug}/settings/integrations`, request.nextUrl.origin)
    );
  } catch (e) {
    console.error("OAuth Callback Error:", e);
    if (e instanceof OAuth2RequestError) {
      // specific OAuth2 error
      return NextResponse.json(
        { error: "OAuth Error: " + e.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
