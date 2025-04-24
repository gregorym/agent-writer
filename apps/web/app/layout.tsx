import TRPCProvider from "@/trpc/provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata = {
  title: "Bloggy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCProvider>{children}</TRPCProvider>
        <Toaster />
      </body>
    </html>
  );
}
