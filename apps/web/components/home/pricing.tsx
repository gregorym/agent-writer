"use client";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
// Remove Link import from lucide-react as it's an icon, not a navigation component
import { Check } from "lucide-react";
import { useState } from "react";

const PAYMENT_LINKS: [string, number][] = [
  ["https://buy.stripe.com/fZe03QcJAcnegus4gj", 49], // Monthly
  ["https://buy.stripe.com/4gw6segZQ2ME1zybIK", 299], // Yearly
];

export default function Pricing() {
  const [isMonthly, setIsMonthly] = useState(false);
  const { data: me } = trpc.users.me.useQuery();

  const features = [
    "We source videos automatically",
    "Streamlined process to record multiple reactions",
    "Easy editing with our built-in editor",
    "Automatically schedule to YouTube, TikTok, LinkedIn and Instagram",
  ];

  return (
    <div className="flex flex-col items-center py-12 px-4 max-w-6xl mx-auto">
      <div className="text-2.5xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
        <span className="inline-flex flex-wrap items-center">
          The formula to building your personal brand
          <span className="dark:text-[#13e0be] dark:bg-[rgba(35,68,31,0.3)] text-[#0b8571] bg-[rgba(157,245,147,0.3)] px-1 rounded relative inline-block z-1">
            You React. We Create.
          </span>
        </span>
      </div>

      <div className="w-full max-w-5xl mt-24">
        {/* Pricing Toggle */}
        <div className="flex items-start mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-lg font-medium",
                  isMonthly ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsMonthly(!isMonthly)}
                className={cn(
                  "w-12 h-6 rounded-full p-1 transition-colors",
                  isMonthly ? "bg-gray-900" : "bg-gray-300"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white transition-transform",
                    isMonthly ? "" : "transform translate-x-6"
                  )}
                />
              </button>
              <span
                className={cn(
                  "text-lg font-medium",
                  !isMonthly ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Yearly
              </span>
            </div>
            {!isMonthly && (
              <span className="text-sm font-medium text-green-600">
                Save 50% with yearly plan
              </span>
            )}
          </div>
        </div>

        {/* Main Content: Pricing + Features */}
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Left: Pricing Block */}
          <div className="w-full md:w-1/2 border rounded-lg overflow-hidden">
            <div className="p-8">
              <h2 className="font-medium text-xl mb-4">Shorts Studio</h2>
              <div className="flex items-baseline">
                <span className="text-6xl font-bold mb-4">
                  {/* Use price from PAYMENT_LINKS array */}$
                  {isMonthly
                    ? PAYMENT_LINKS[0][1]
                    : Math.round(PAYMENT_LINKS[1][1] / 12)}
                </span>
              </div>
              <div className="text-muted-foreground mb-6">
                USD / {isMonthly ? "month" : "month, billed annually"}
              </div>
              {/* Use link from PAYMENT_LINKS array, add prefilled_email if user is logged in */}
              <a
                href={`${isMonthly ? PAYMENT_LINKS[0][0] : PAYMENT_LINKS[1][0]}${me?.email ? `?prefilled_email=${encodeURIComponent(me.email)}` : ""}`}
                target="_blank" // Open in new tab for external link
                rel="noopener noreferrer" // Security best practice for target="_blank"
                className="block w-full bg-amber-400 hover:bg-amber-500 text-black text-center py-3 rounded-md font-medium transition-colors"
              >
                START MY 7-DAY FREE TRIAL
              </a>
            </div>
          </div>

          {/* Right: Features List */}
          <div className="w-full md:w-1/2">
            <h3 className="text-2xl font-medium mb-6">What's included:</h3>
            <ul className="space-y-5">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
