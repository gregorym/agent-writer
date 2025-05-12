import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const LIST = [
  {
    question: "What is Agent Writer?",
    answer:
      "Agent Writer is an AI-powered content creation and SEO optimization service designed for busy early-stage product teams. We handle everything from keyword strategy to publishing, helping you rank on Google and ChatGPT effortlessly.",
  },
  {
    question: "How does Agent Writer save me time and effort?",
    answer:
      "Instead of juggling multiple tools, hiring freelancers, or spending hours on content and SEO yourself, Agent Writer provides a complete, done-for-you solution. Our AI drafts content, and our human experts refine and optimize it, freeing you to focus on your product.",
  },
  {
    question: "Who is Agent Writer for?",
    answer:
      "Agent Writer is ideal for early-stage startups, indie hackers, and small product teams who need to establish an online presence and drive organic growth but lack the time, resources, or expertise to manage complex SEO and content strategies.",
  },
  {
    question: "How does the 'AI + Human' approach work?",
    answer:
      "Our process combines the speed and efficiency of AI for initial drafting and data analysis with the critical thinking, creativity, and quality assurance of human SEO experts and editors. This ensures your content is not only optimized but also high-quality and brand-aligned.",
  },
  {
    question: "What kind of results can I expect?",
    answer:
      "Our goal is to help you rank higher on Google and gain visibility on platforms like ChatGPT. While results vary based on your niche and starting point, Agent Writer is designed to significantly improve your organic traffic, keyword rankings, and overall online authority over time.",
  },
  {
    question: "Do I need any SEO knowledge to use Agent Writer?",
    answer:
      "Not at all! Agent Writer is designed to be a hands-off solution. We handle all the SEO complexities, from technical optimization to content strategy, so you don't have to.",
  },
  {
    question:
      "How is Agent Writer different from just using an AI writing tool?",
    answer:
      "While AI writing tools can generate text, Agent Writer offers a comprehensive service. We provide strategy, human editing and optimization, technical SEO, and ongoing management to ensure your content actually ranks and drives results, not just fills pages.",
  },
];

export function FAQ() {
  return (
    <div className="mt-48">
      <span className="flex gap-1.5 hover:opacity-80 transition-opacity items-center font-semibold text-blue-500">
        Got Questions?
      </span>
      <h3 className="font-bold text-2xl md:text-5xl tracking-tight">
        We've Got Answers (FAQ)
      </h3>
      <Accordion type="single" collapsible className="w-full mt-12">
        {LIST.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-lg">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
