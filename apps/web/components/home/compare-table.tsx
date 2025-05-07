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
        How You Create YouTube Videos
      </h3>
      <h4 className="text-3xl font-bold mb-6 dark:text-white">
        <span className="text-red-500">The Old Way</span> vs{" "}
        <span className="text-green-400">Your New Way with Shorts Studio</span>
      </h4>
      <Table className="">
        <TableHeader>
          <TableRow className="">
            <TableHead className="dark:text-white w-1/4">Step</TableHead>
            <TableHead className="text-red-500 dark:text-red-400 w-1/3">
              Traditional YouTube
            </TableHead>
            <TableHead className="text-green-500 dark:text-green-200 w-1/3">
              With Shorts Studio
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-pretty">
          {[
            [
              "Finding an idea",
              "Brainstorm and research trending topics",
              "We send you viral clips to react to",
            ],
            [
              "Scripting",
              "Write detailed scripts or outlines",
              "No script needed — just react authentically",
            ],
            [
              "Recording",
              "Multiple takes to get it right",
              "One take — quick, natural reaction",
            ],
            [
              "Editing",
              "Requires software and hours of fine-tuning",
              "Auto-edited by Shorts Studio",
            ],
            [
              "Thumbnail",
              "Design or pay for a custom thumbnail",
              "Not needed (shorts don’t use thumbnails)",
            ],
            [
              "On-camera pressure",
              "High — you need to perform and present well",
              "Low — just give your honest reaction",
            ],
            ["Time required", "2–10 hours per video", "Less than 10 minutes"],
            [
              "Barrier to start",
              "High — tools, skills, and confidence needed",
              "Extremely low — anyone can start",
            ],
            [
              "Expert positioning",
              "Slow and uncertain build-up",
              "Immediate — you're seen reacting in your niche",
            ],
          ].map(([step, traditional, shorts], index) => (
            <TableRow key={step}>
              <TableCell className="dark:text-white font-medium">
                {step}
              </TableCell>
              <TableCell className="text-red-500 dark:text-red-300 flex gap-1 items-center">
                {traditional}
              </TableCell>
              <TableCell className="text-green-500 dark:text-green-200">
                {shorts}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
