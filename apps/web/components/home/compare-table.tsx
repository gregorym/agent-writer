import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompareTable() {
  const comparisonData = [
    [
      "Overall Approach",
      "Juggling multiple SEO tools, freelance writers, and your own time to piece together a content strategy. Constant research and learning required.",
      "A single, unified solution. We handle every step from keyword research to publishing, so you get expert results without the complexity. Focus on your core business, we'll handle the blog.",
    ],
    [
      "Strategy & Research",
      "Spending hours on keyword research, competitor analysis, and topic ideation using expensive tools. Guessing what content will actually rank and resonate.",
      "Our AI and expert team perform in-depth market and keyword research, crafting a data-driven content strategy tailored to your goals. All research and strategy included.",
    ],
    [
      "Content Creation & SEO",
      "Writing articles yourself (taking days), or managing and paying expensive writers. Then, more time spent on manual on-page SEO for each piece.",
      "High-quality, SEO-optimized articles created for you. Our Agent Writer drafts content, and human editors refine it, ensuring it matches your brand and is primed for search engines. All writing, editing, and SEO included.",
    ],
    [
      "Review & Quality Assurance",
      "Multiple back-and-forths with writers, proofreading, fact-checking, and ensuring SEO best practices are met. Risk of inconsistent quality.",
      "Rigorous in-house review process. Our editorial team ensures every article is polished, accurate, and perfectly optimized before it goes live. Consistent, high-quality content, every time.",
    ],
    [
      "Scheduling & Publishing",
      "Manually planning content calendars, remembering to publish at optimal times, or wrestling with third-party scheduling tools.",
      "Fully automated content scheduling and publishing. We ensure your blog has a consistent flow of fresh content, published optimally, without you lifting a finger.",
    ],
    [
      "Cost & Resources",
      "Monthly subscriptions for multiple SEO tools (Ahrefs, SEMrush, etc.), writer fees, editor fees, and potentially agency retainers. Costs quickly add up.",
      "One predictable, all-inclusive price. No need to pay for separate SEO tools, writers, or editors. Everything is covered in your plan, saving you significant costs.",
    ],
    [
      "Time Investment",
      "10-20+ hours per week dedicated to managing your blog, from research and writing to optimization and scheduling. Time you could spend on your product or customers.",
      "Virtually zero time required from you. We take care of the entire blogging lifecycle, freeing you up to focus on what you do best. Reclaim your valuable time.",
    ],
    [
      "Staying Updated",
      "Constantly trying to keep up with ever-changing Google algorithms, new AI trends, and SEO best practices. It's a full-time job in itself.",
      "Our team of experts is always ahead of the curve, proactively adapting your strategy to the latest algorithm updates and AI advancements, ensuring sustained growth.",
    ],
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 mt-48">
      <span className="flex gap-1.5 hover:opacity-80 transition-opacity items-center font-semibold text-blue-500">
        Compare
      </span>

      <h3 className="font-bold text-2xl md:text-5xl tracking-tight">
        Unlock Top Rankings on Google & ChatGPT
      </h3>
      <h4 className="text-3xl font-bold mb-10 dark:text-white text-center md:text-left">
        <span className="text-red-500">The Complex, Manual Way</span> vs{" "}
        <span className="text-green-400">
          Effortless Results with Agent Writer
        </span>
      </h4>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comparisonData.map(([aspect, diy, agentWriter]) => (
          <Card key={aspect} className="flex flex-col">
            <CardHeader>
              <CardTitle className="dark:text-white text-lg">
                {aspect}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow grid grid-cols-1 gap-4">
              <div className="border-t pt-4">
                <h5 className="font-semibold text-red-500 dark:text-red-400 mb-1 text-sm">
                  The DIY / Multi-Tool Way
                </h5>
                <p className="text-xs text-muted-foreground dark:text-gray-400">
                  {diy}
                </p>
              </div>
              <div className="border-t pt-4">
                <h5 className="font-semibold text-green-500 dark:text-green-300 mb-1 text-sm">
                  With Agent Writer
                </h5>
                <p className="text-xs text-muted-foreground dark:text-gray-300">
                  {agentWriter}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
