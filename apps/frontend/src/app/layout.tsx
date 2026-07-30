import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ScrollToTop } from "@/components/ScrollToTop";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://audit.razib.bd";
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Website Audit by Razib",
    template: "%s | Website Audit by Razib",
  },
  description:
    "Comprehensive 6-in-1 Website Audit by Razib: Font Licensing Classification, CTA Design Tokens, Alt Tag & SEO Compliance Scanner.",
  keywords: [
    "Website Audit",
    "Website Audit by Razib",
    "Font License Scanner",
    "Font Finder",
    "SEO Compliance Scanner",
    "Alt Tag Checker",
    "CTA Token Audit",
    "Accessibility Audit",
    "Razib Hossain",
  ],
  authors: [{ name: "Razib Hossain" }],
  creator: "Razib Hossain",
  publisher: "Razib Hossain",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Website Audit by Razib",
    description:
      "Comprehensive 6-in-1 Website Audit by Razib: Font Licensing Classification, CTA Design Tokens, Alt Tag & SEO Compliance Scanner.",
    siteName: "Website Audit by Razib",
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Audit by Razib",
    description:
      "Comprehensive 6-in-1 Website Audit by Razib: Font Licensing Classification, CTA Design Tokens, Alt Tag & SEO Compliance Scanner.",
    creator: "@razibhossain",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Website Audit by Razib",
  url: siteUrl,
  description:
    "Comprehensive 6-in-1 Website Audit by Razib: Font Licensing Classification, CTA Design Tokens, Alt Tag & SEO Compliance Scanner.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "All",
  author: {
    "@type": "Person",
    name: "Razib Hossain",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark suppressHydrationWarning">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen transition-colors duration-200 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}>
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 pb-16">{children}</main>
          <Footer />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}

