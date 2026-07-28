import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Website Audit AI Dashboard | Monorepo",
  description: "Comprehensive 6-in-1 Website Audit Dashboard: Font Classification, CTA Design, Alt Tag & SEO Compliance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Navbar />
        <main className="flex-1 pb-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
