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
    "Comprehensive 6-in-1 Website Audit by Razib: Font Licensing Classification, CTA Design, Alt Tag & SEO Compliance Scanner.",
  keywords: [
    "Website Audit",
    "Website Audit by Razib",
    "Font License Scanner",
    "Font Finder",
    "SEO Compliance Scanner",
    "Alt Tag Checker",
    "CTA Audit",
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
      "Comprehensive 6-in-1 Website Audit by Razib: Font Licensing Classification, CTA Design, Alt Tag & SEO Compliance Scanner.",
    siteName: "Website Audit by Razib",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Website Audit by Razib - Font Licensing, CTA Audit, and SEO Compliance Scanner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Audit by Razib",
    description:
      "Comprehensive 6-in-1 Website Audit by Razib: Font Licensing Classification, CTA Design, Alt Tag & SEO Compliance Scanner.",
    creator: "@razibhossain",
    images: ["/og-image.png"],
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Website Audit by Razib",
  url: siteUrl,
  description:
    "Comprehensive 6-in-1 Website Audit by Razib: Font Licensing Classification, CTA Design, Alt Tag & SEO Compliance Scanner.",
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
    <html lang="en" className="light suppressHydrationWarning">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N73RW76T');`,
          }}
        />
        {/* End Google Tag Manager */}
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N73RW76T"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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

