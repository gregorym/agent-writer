"use client";
import { ChevronRight, Github, PenTool } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export default function Navbar() {
  return (
    <div className="w-full h-15 flex items-center transition-colors z-50 sticky top-0 bg-background/80 backdrop-blur-lg border-b border-transparent">
      <nav
        aria-label="Main"
        data-orientation="horizontal"
        dir="ltr"
        className="max-w-5xl mx-auto px-6 h-full w-full relative flex items-center"
      >
        <Link href="/" className="text-lg flex items-center gap-3">
          <PenTool className="h-6 w-6 text-blue-500" />
          Agent Writer
        </Link>

        <div className="ml-auto flex items-center gap-4">
          <Button variant={"outline"}>
            <Link
              href="https://github.com/gregorym/agent-writer"
              target="_blank"
              className="flex gap-1 items-center"
            >
              Open-Source
              <Github />
            </Link>
          </Button>
          <Button variant={"default"}>
            <Link href="/login" className="flex gap-1 items-center">
              Start now
              <ChevronRight className="group-hover:translate-x-1 transition-all" />
            </Link>
          </Button>
        </div>
      </nav>
    </div>
  );
}
