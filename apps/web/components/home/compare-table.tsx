import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CompareTable() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 mt-48">
      <span className="flex gap-1.5 hover:opacity-80 transition-opacity items-center font-semibold text-blue-500">
        Compare
      </span>

      <h3 className="font-bold text-2xl md:text-5xl tracking-tight">
        Unlock Top Rankings on Google & ChatGPT
      </h3>
      <h4 className="text-3xl font-bold mb-6 dark:text-white">
        <span className="text-red-500">The Complex, Manual Way</span> vs{" "}
        <span className="text-green-400">
          Effortless Results with Agent Writer
        </span>
      </h4>
      <Table className="">
        <TableHeader>
          <TableRow className="">
            <TableHead className="dark:text-white w-1/4">Aspect</TableHead>
            <TableHead className="text-red-500 dark:text-red-400 w-1/3">
              The DIY / Multi-Tool Way
            </TableHead>
            <TableHead className="text-green-500 dark:text-green-200 w-1/3">
              With Agent Writer
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-pretty">
          {[
            [
              "Keyword & Topic Strategy",
              "Hours of manual research with multiple SEO tools (Ahrefs, SEMrush), analyzing competitors, and guessing intent.",
              "AI discovers high-impact keywords and topics; our experts validate and build your content roadmap.",
            ],
            [
              "Content Creation",
              "Writing yourself (days per article), or hiring expensive writers, managing revisions, ensuring quality and SEO.",
              "AI drafts SEO-optimized content, then our human editors refine it to perfection for your brand voice.",
            ],
            [
              "On-Page SEO",
              "Manually optimizing titles, metas, headers, images, internal links. Constant learning curve for SEO best practices.",
              "Fully managed on-page optimization by our AI and SEO specialists. Always up-to-date.",
            ],
            [
              "Technical SEO",
              "Wrestling with site speed, mobile usability, schema markup, sitemaps. Often requires developer help.",
              "We handle the technical complexities to ensure your site is loved by search engines.",
            ],
            [
              "Content for ChatGPT",
              "Guessing what works for AI discovery, separate optimization efforts, hoping for visibility.",
              "Content structured for discoverability on ChatGPT and other AI platforms, expanding your reach.",
            ],
            [
              "Tracking & Reporting",
              "Juggling Google Analytics, Search Console, and rank trackers. Difficult to see the full picture.",
              "Clear, concise reports on your progress and ROI. We track everything for you.",
            ],
            [
              "Adapting to Changes",
              "Constantly chasing Google algorithm updates and new AI trends. Risk of falling behind.",
              "Our team stays ahead of the curve, proactively adapting your strategy for sustained growth.",
            ],
            [
              "Tool & Team Costs",
              "Subscriptions for SEO tools ($100s/mo), writing tools, analytics, plus potential freelancer/agency fees.",
              "One simple, all-inclusive plan. No hidden fees, no extra tools needed.",
            ],
            [
              "Time Investment",
              "10-20+ hours per week managing everything yourself or coordinating multiple providers.",
              "Minimal effort from your side. Focus on your product, we handle the growth.",
            ],
          ].map(([aspect, diy, agentWriter]) => (
            <TableRow key={aspect}>
              <TableCell className="dark:text-white font-medium">
                {aspect}
              </TableCell>
              <TableCell className="text-red-500 dark:text-red-300">
                {diy}
              </TableCell>
              <TableCell className="text-green-500 dark:text-green-200">
                {agentWriter}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
