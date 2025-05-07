"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="w-full h-15 flex items-center transition-colors z-50 sticky top-0 bg-background/80 backdrop-blur-lg border-b border-transparent">
      <nav
        aria-label="Main"
        data-orientation="horizontal"
        dir="ltr"
        className="max-w-5xl mx-auto px-6 h-full w-full relative flex items-center"
      >
        <Link href="/" className="text-lg font-bold flex items-center gap-3">
          <img
            src="https://ipfs.filebase.io/ipfs/QmcoB8EGeBwR8Aw3SpsGSh9pJ1T5QZDZDtTdMSYMVSWF5Z"
            alt="Shorts Studio Logo"
            width={24}
            height={24}
            className=""
          />{" "}
          Shorts Studio
        </Link>

        <div className="ml-auto"></div>
      </nav>
    </div>
  );
}
