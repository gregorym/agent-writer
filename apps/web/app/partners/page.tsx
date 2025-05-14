"use client";

import Footer from "@/components/home/footer";
import Navbar from "@/components/home/navbar";
import { useEffect } from "react"; // Import useEffect

export default function BlogPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/widget/partner.js";
    script.defer = true;
    document.body.appendChild(script);

    // Cleanup function to remove the script when the component unmounts
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount and cleans up on unmount

  return (
    <div className="flex flex-col w-full">
      <Navbar />
      <div className="max-w-5xl px-6 mx-auto w-full">
        <div className="py-12  text-2.5xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
          <h1 className="">Partners</h1>
        </div>
        <div
          id="agentwriter-partners"
          className="relative z-0 mx-auto max-w-grid-width"
        >
          {/* Content will be injected by partner.js after client-side hydration */}
        </div>
        {/* <script defer src="/widget/partner.js"></script> Script tag removed from here */}
        <Footer />
      </div>
    </div>
  );
}
