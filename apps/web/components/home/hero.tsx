"use client";
import { Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "../ui/button";

export default function Hero() {
  const [playingVideos, setPlayingVideos] = useState<Record<number, boolean>>(
    {}
  );
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const handleVideoClick = (index: number) => {
    const videoElement = videoRefs.current[index];
    if (!videoElement) return;

    if (videoElement.paused) {
      videoElement.play();
      setPlayingVideos((prev) => ({ ...prev, [index]: true }));
    } else {
      videoElement.pause();
      setPlayingVideos((prev) => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="flex flex-col py-12">
      <div className="">
        <div className="text-2.5xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
          <h1 className="">
            The SEO Agent working for you.
            <span className="text-[#d4af37] bg-[rgba(212,175,55,0.3)] px-1 rounded relative z-1">
              Writing, research and scheduling automated.
            </span>
          </h1>
        </div>
      </div>
      <div className="flex gap-2.5 mt-5">
        <Button variant={"default"}>
          <Link href="/app" className="flex gap-1 items-center">
            Start now
            <ChevronRight className="group-hover:translate-x-1 transition-all" />
          </Link>
        </Button>
        <Button variant={"outline"}>
          <Link href="/login" className="flex gap-2 items-center">
            Request a demo
            <Calendar className="" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
