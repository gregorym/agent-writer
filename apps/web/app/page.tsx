import CompareTable from "@/components/home/compare-table";
import { FAQ } from "@/components/home/faq";
import Footer from "@/components/home/footer";
import TheFormula from "@/components/home/formula";
import Hero from "@/components/home/hero";
import Navbar from "@/components/home/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Writer - Home",
  description: "Create and publish articles with AI.",
};

export default function IndexPage() {
  return (
    <div className="flex flex-col w-full">
      <Navbar />
      <div className="max-w-5xl px-6 mx-auto w-full">
        <Hero />
        <TheFormula />
        <CompareTable />
        <FAQ />
        <Footer />
      </div>
    </div>
  );
}
