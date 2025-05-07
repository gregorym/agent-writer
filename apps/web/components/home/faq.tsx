import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const LIST = [
  {
    question: "What exactly is Shorts Studio?",
    answer:
      "Shorts Studio is your secret weapon for creating engaging YouTube Shorts reaction videos quickly and easily. It's designed to help you establish yourself as an expert in your niche using the powerful Shorts format.",
  },
  {
    question: "How does Shorts Studio help me?",
    answer:
      "We built Shorts Studio because we know traditional YouTube videos are tough – they take time, complex editing, and often feel daunting. We simplify everything. We find trending clips in your niche for you to react to, handle the video editing automatically, and make the whole process incredibly straightforward. You focus on sharing your expertise; we handle the production.",
  },
  {
    question: "Is it free to try?",
    answer:
      "Absolutely! You can explore all features with a 7-day free trial. If you love it, you can choose a subscription plan that fits your needs.",
  },
  {
    question: "How can I suggest a feature or report a problem?",
    answer:
      "We'd love to hear from you! You can easily send us your feature ideas or report any issues through our support email or the contact form on our website.",
  },
  {
    question: "Will you upload my Shorts to YouTube for me?",
    answer:
      "While automatic uploading isn't available just yet, it's high on our priority list! For now, downloading your finished Short and uploading it to YouTube is quick and simple.",
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
