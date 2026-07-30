import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance & Audit Guides",
  description:
    "Comprehensive guides and documentation on web font licensing compliance, CTA design tokens, and alt tag accessibility standards.",
  openGraph: {
    title: "Compliance & Audit Guides | Website Audit by Razib",
    description:
      "Comprehensive guides and documentation on web font licensing compliance, CTA design tokens, and alt tag accessibility standards.",
  },
};

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
