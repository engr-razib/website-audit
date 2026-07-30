import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Control Center & Scanner",
  description:
    "Run real-time font licensing audits, CTA design token extraction, image alt tag validation, and full website compliance scans.",
  openGraph: {
    title: "Audit Control Center & Scanner | Website Audit by Razib",
    description:
      "Run real-time font licensing audits, CTA design token extraction, image alt tag validation, and full website compliance scans.",
  },
};

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
