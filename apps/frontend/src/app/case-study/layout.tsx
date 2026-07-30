import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Case Study & Architecture",
  description:
    "Explore the deep-dive case study on building the 6-in-1 Website Audit by Razib, font license detection algorithms, and automated compliance scanning.",
  openGraph: {
    title: "Case Study & Architecture | Website Audit by Razib",
    description:
      "Explore the deep-dive case study on building the 6-in-1 Website Audit by Razib, font license detection algorithms, and automated compliance scanning.",
  },
};

export default function CaseStudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
