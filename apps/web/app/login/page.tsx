import { LoginForm } from "@/components/login-form";
import { lucia } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Agent Writer - Login",
  description: "Login to your Agent Writer account.",
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;

  if (sessionId) {
    const { user } = await lucia.validateSession(sessionId);
    const website = await prisma?.website.findFirst({
      where: {
        user_id: user?.id,
      },
      select: {
        slug: true,
      },
    });
    if (website) return redirect(`/w/${website.slug}`);
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
