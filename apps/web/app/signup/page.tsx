import { SignupForm } from "@/components/signup-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Writer - Signup",
  description: "Create an Agent Writer account.",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}
