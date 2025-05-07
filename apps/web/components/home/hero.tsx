"use client";
import { cn } from "@/lib/utils";
import { ChevronRight, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

const SAMPLES = [
  [
    `QmTDSwT92znKctdTXox28TJnqUpNS2daCXihjM2jfihKqw`,
    `QmPwyhXTi86uUD3f7a7aRzP6bFTLDy6FBNbgGjAQ9fVXej`,
  ],
  [
    `Qmdonp8Wn2nPfHHXgzxszdoRuE1M7JAUiKGz96G8a7Ve8Y`,
    `QmTwVBU13jqU2KSXDMuyH8cnZDXZWWZ9hvajADNVxmDZXA`,
  ],
  [
    `QmcUJEy4DFPUViqXfeFXQbKzQrqDmRLrGgi3bTFxaM5tzk`,
    `QmWmTGR9WUNjsCHhBMAhhjatTagtAxM7iUj84tqMjCNmoY`,
  ],
  [
    `QmbBhwAejbKYKhW9g7yJefhApjDboV2s5At2Rcw29Fcw7g`,
    `QmUpX9sQBNUxQVZH4jRJEhWk6CiD9KmmGW7BPLMhZ812zF`,
  ],
];

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
          <span className="inline-flex flex-wrap items-center">
            The formula to building your personal brand
            <span className="text-[#d4af37] bg-[rgba(212,175,55,0.3)] px-1 rounded relative inline-block z-1">
              You React. We Create.
            </span>
          </span>
        </div>
      </div>
      <div className="flex gap-2.5 mt-5">
        <Link
          href="/login"
          className="text-sm sm:text-md md:text-base bg-blue-500 font-semibold text-white px-7 py-3 rounded-xl tracking-[-0.0125em] inline-flex items-center justify-center group"
        >
          Start now
          <ChevronRight className="group-hover:translate-x-1 transition-all" />
        </Link>
        <a
          className="text-sm sm:text-md md:text-base text-secondary font-semibold shadow-natural px-7 py-3 rounded-xl bg-black tracking-[-0.0125em] flex items-center gap-2"
          href="/login"
        >
          Request a demo
        </a>
      </div>
      <div className="flex justify-center gap-8 w-full overflow-x-auto px-4 py-8 mx-auto mt-24">
        {SAMPLES.map((sample, index) => (
          <div
            key={index}
            className="relative group cursor-pointer"
            onClick={() => handleVideoClick(index)}
          >
            <video
              // @ts-ignore
              ref={(el) => (videoRefs.current[index] = el)}
              className={cn(
                "h-auto w-52 rounded-lg border-black border-6 aspect-[9/16] object-cover",
                index % 2 === 0
                  ? "-rotate-2 -translate-y-2"
                  : "rotate-2 translate-y-2"
              )}
              poster={`https://ipfs.filebase.io/ipfs/${sample[0]}`}
              src={`https://ipfs.filebase.io/ipfs/${sample[1]}`}
              preload="none"
            />
            <div
              className={cn(
                "absolute inset-0 bg-white opacity-0 group-hover:opacity-50 transition-opacity duration-200 rounded-lg",
                index % 2 === 0
                  ? "-rotate-2 -translate-y-2"
                  : "rotate-2 translate-y-2"
              )}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {playingVideos[index] ? (
                <Pause className="text-black" size={48} />
              ) : (
                <Play className="text-black" size={48} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
