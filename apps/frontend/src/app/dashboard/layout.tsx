import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Dashboard & Scanner",
  description:
    "Run real-time font licensing audits, CTA design token extraction, image alt tag validation, and full website compliance scans.",
  openGraph: {
    title: "Audit Dashboard & Scanner | Website Audit by Razib",
    description:
      "Run real-time font licensing audits, CTA design token extraction, image alt tag validation, and full website compliance scans.",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
